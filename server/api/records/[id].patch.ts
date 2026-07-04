import { createCloudflareClient, syncTunnelConfiguration } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })
    }

    try {
        const record = await prisma.dnsRecord.findUnique({
            where: { id: parseInt(id) },
            include: { zone: true }
        })

        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })
        if (!record.zone.accountId) throw createError({ statusCode: 400, statusMessage: 'Zone has no linked account' })

        const oldTunnelId = record.tunnelId
        const oldRoutingMode = record.routingMode

        let targetType = body.type || record.type
        let targetContent = body.content || record.content
        let targetProxied = typeof body.proxied === 'boolean' ? body.proxied : record.proxied
        let routingMode = body.routingMode || record.routingMode
        let tunnelId = body.tunnelId !== undefined ? body.tunnelId : record.tunnelId
        let localAddress = body.localAddress !== undefined ? body.localAddress : record.localAddress

        if (routingMode === 'tunnel') {
            const finalTunnelId = tunnelId || oldTunnelId
            if (!finalTunnelId || !localAddress) {
                throw createError({ statusCode: 400, statusMessage: 'tunnelId and localAddress are required for tunnel routing mode' })
            }
            const tunnel = await prisma.cloudflareTunnel.findUnique({ where: { tunnelId: finalTunnelId } })
            if (!tunnel) throw createError({ statusCode: 404, statusMessage: 'Selected Cloudflare Tunnel not found' })
            
            targetType = 'CNAME'
            targetContent = `${tunnel.tunnelId}.cfargotunnel.com`
            targetProxied = true
        }

        const cf = await createCloudflareClient(record.zone.accountId)

        // Build update payload
        const updatePayload: any = {
            zone_id: record.zone.cfZoneId,
            type: targetType,
            name: body.name || record.name,
            content: targetContent,
            proxied: targetProxied,
        }

        // Update on Cloudflare
        await cf.dns.records.edit(record.cfRecordId, updatePayload as any)

        // Update local DB
        const dbUpdate: any = {
            type: targetType,
            content: targetContent,
            proxied: targetProxied,
            routingMode,
            tunnelId: routingMode === 'tunnel' ? (tunnelId || oldTunnelId) : null,
            localAddress: routingMode === 'tunnel' ? localAddress : null,
            isAutoUpdate: routingMode === 'ddns'
        }
        if (body.name) dbUpdate.name = body.name

        const updated = await prisma.dnsRecord.update({
            where: { id: parseInt(id) },
            data: dbUpdate
        })

        // Sync old tunnel if we switched away or changed tunnels
        if (oldRoutingMode === 'tunnel' && oldTunnelId && (routingMode !== 'tunnel' || (tunnelId && tunnelId !== oldTunnelId))) {
            await syncTunnelConfiguration(record.zone.accountId, oldTunnelId)
        }

        // Sync new tunnel if we are in tunnel mode
        if (routingMode === 'tunnel' && dbUpdate.tunnelId) {
            await syncTunnelConfiguration(record.zone.accountId, dbUpdate.tunnelId)
        }

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'UPDATE_RECORD',
                `Record: ${updated.name} (${updated.type})`,
                { updateDetails: dbUpdate }
            )
        }

        return {
            success: true,
            data: updated,
            message: `Record ${updated.name} updated successfully.`
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to update record'
        })
    }
})
