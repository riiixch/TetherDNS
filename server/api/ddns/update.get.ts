import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const token = query.token as string
    const ip = query.ip as string

    if (!token) {
        throw createError({ statusCode: 401, statusMessage: 'Token is required' })
    }

    if (!ip) {
        throw createError({ statusCode: 400, statusMessage: 'IP address is required' })
    }

    // IP Validation
    const isV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)
    const isV6 = /^[a-fA-F0-9:]+$/.test(ip)
    if (!isV4 && !isV6) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid IP address format' })
    }

    const record = await prisma.dnsRecord.findUnique({
        where: { updateToken: token },
        include: { zone: true }
    })

    if (!record) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    try {
        if (record.content === ip) {
            return { success: true, message: 'IP is already up to date', ip }
        }

        const cf = await createCloudflareClient(record.zone.accountId!)

        await cf.dns.records.edit(record.cfRecordId, {
            zone_id: record.zone.cfZoneId,
            type: record.type as 'A' | 'AAAA',
            name: record.name,
            content: ip,
            proxied: record.proxied,
            ttl: 1
        })

        await prisma.dnsRecord.update({
            where: { id: record.id },
            data: { content: ip }
        })

        await prisma.updateLog.create({
            data: {
                oldIp: record.content,
                newIp: ip,
                status: 'SUCCESS',
                recordId: record.id
            }
        })

        return { success: true, message: 'DDNS updated successfully', record: record.name, ip }
    } catch (e: any) {
        // Log failure
        await prisma.updateLog.create({
            data: {
                oldIp: record.content,
                newIp: ip,
                status: 'FAILED',
                message: e.message || 'Cloudflare API error',
                recordId: record.id
            }
        })
        throw createError({ statusCode: 500, statusMessage: e.message || 'Error updating DDNS' })
    }
})
