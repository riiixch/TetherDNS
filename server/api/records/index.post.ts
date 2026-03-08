import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.cfZoneId || !body.type || !body.name || !body.content) {
        throw createError({ statusCode: 400, statusMessage: 'cfZoneId, type, name, and content are required' })
    }

    try {
        const zone = await prisma.zone.findUnique({ where: { cfZoneId: body.cfZoneId } })
        if (!zone) throw createError({ statusCode: 404, statusMessage: 'Zone not found' })
        if (!zone.accountId) throw createError({ statusCode: 400, statusMessage: 'Zone has no linked account' })

        const cf = await createCloudflareClient(zone.accountId)

        // Create on Cloudflare
        const created = await cf.dns.records.create({
            zone_id: body.cfZoneId,
            type: body.type,
            name: body.name,
            content: body.content,
            proxied: body.proxied ?? false,
            ttl: body.ttl || 1,
        } as any)

        if (!created.id) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to create record on Cloudflare' })
        }

        // Save to local DB
        const createdRecord = await prisma.dnsRecord.create({
            data: {
                cfRecordId: created.id, // Assuming 'created' is the Cloudflare response object
                name: body.name,
                type: body.type,
                content: body.content,
                proxied: body.proxied ?? false, // Use body.proxied if available, otherwise false
                isAutoUpdate: false, // Added field
                zoneId: zone.id // Assuming 'zone' is the local DB zone object
            }
        })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'CREATE_RECORD',
                `Record: ${body.name} (${body.type})`,
                { content: body.content, proxied: body.proxied, zone: zone.name } // Assuming zone.name exists
            )
        }

        return { success: true, data: createdRecord, message: 'Record created successfully' }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to create record'
        })
    }
})
