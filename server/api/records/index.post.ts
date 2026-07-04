import { prisma } from '../../utils/prisma'
import { createCloudflareClient, syncTunnelConfiguration } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const isTunnelMode = body.routingMode === 'tunnel'
    const requiredContent = isTunnelMode ? true : !!body.content

    if (!body.cfZoneId || !body.type || !body.name || !requiredContent) {
        throw createError({ statusCode: 400, statusMessage: 'cfZoneId, type, name, and content are required' })
    }

    try {
        const zone = await prisma.zone.findUnique({ where: { cfZoneId: body.cfZoneId } })
        if (!zone) throw createError({ statusCode: 404, statusMessage: 'Zone not found' })
        if (!zone.accountId) throw createError({ statusCode: 400, statusMessage: 'Zone has no linked account' })

        let targetContent = body.content
        let targetType = body.type
        let targetProxied = body.proxied ?? false

        if (isTunnelMode) {
            if (!body.tunnelId || !body.localAddress) {
                throw createError({ statusCode: 400, statusMessage: 'tunnelId and localAddress are required for tunnel routing mode' })
            }
            const tunnel = await prisma.cloudflareTunnel.findUnique({ where: { tunnelId: body.tunnelId } })
            if (!tunnel) throw createError({ statusCode: 404, statusMessage: 'Selected Cloudflare Tunnel not found' })
            targetType = 'CNAME'
            targetContent = `${tunnel.tunnelId}.cfargotunnel.com`
            targetProxied = true // Tunnels are proxied by default
        }

        const cf = await createCloudflareClient(zone.accountId)

        // Create on Cloudflare
        const created = await cf.dns.records.create({
            zone_id: body.cfZoneId,
            type: targetType,
            name: body.name,
            content: targetContent,
            proxied: targetProxied,
            ttl: body.ttl || 1,
        } as any)

        if (!created.id) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to create record on Cloudflare' })
        }

        // Save to local DB
        const createdRecord = await prisma.dnsRecord.create({
            data: {
                cfRecordId: created.id,
                name: body.name,
                type: targetType,
                content: targetContent,
                proxied: targetProxied,
                isAutoUpdate: body.routingMode === 'ddns',
                routingMode: body.routingMode || 'static',
                tunnelId: body.tunnelId || null,
                localAddress: body.localAddress || null,
                zoneId: zone.id
            }
        })

        // If routing mode is tunnel, sync configuration
        if (isTunnelMode && body.tunnelId) {
            await syncTunnelConfiguration(zone.accountId, body.tunnelId)
        }

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'CREATE_RECORD',
                `Record: ${body.name} (${targetType})`,
                { content: targetContent, proxied: targetProxied, zone: zone.name, routingMode: body.routingMode }
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
