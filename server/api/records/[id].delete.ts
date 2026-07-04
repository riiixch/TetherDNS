import { createCloudflareClient, syncTunnelConfiguration } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

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

        const cf = await createCloudflareClient(record.zone.accountId)

        // Delete from Cloudflare
        try {
            await cf.dns.records.delete(record.cfRecordId, { zone_id: record.zone.cfZoneId })
        } catch (error: any) {
            const errorMsg = error.message || ''
            const isAlreadyDeleted = errorMsg.includes('Record does not exist') || error.code === 81044 || String(error).includes('81044')
            if (isAlreadyDeleted) {
                console.warn(`[Record Delete] Record ${record.name} was already deleted on Cloudflare. Proceeding with local database deletion.`)
            } else {
                throw error
            }
        }

        const oldTunnelId = record.tunnelId
        const oldRoutingMode = record.routingMode

        // Delete update logs first then the record
        await prisma.updateLog.deleteMany({ where: { recordId: record.id } })
        await prisma.dnsRecord.delete({ where: { id: record.id } })

        // Sync tunnel configuration to remove this record's hostname if it was tunnel mode
        if (oldRoutingMode === 'tunnel' && oldTunnelId) {
            await syncTunnelConfiguration(record.zone.accountId, oldTunnelId)
        }

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'DELETE_RECORD',
                `Record: ${record.name} (${record.type})`,
                { zone: record.zone.name, content: record.content }
            )
        }

        return { success: true, message: `Record ${record.name} deleted successfully.` }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to delete record'
        })
    }
})
