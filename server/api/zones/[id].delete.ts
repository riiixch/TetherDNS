import { prisma } from '../../utils/prisma'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const zoneId = getRouterParam(event, 'id')

    if (!zoneId) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID is required' })
    }

    try {
        // Find local zone to get accountId
        const localZone = await prisma.zone.findUnique({ where: { cfZoneId: zoneId } })

        if (!localZone) {
            throw createError({ statusCode: 404, statusMessage: 'Zone not found in local database.' })
        }

        // Delete related update logs
        const records = await prisma.dnsRecord.findMany({ where: { zoneId: localZone.id } })
        const recordIds = records.map(r => r.id)

        await prisma.updateLog.deleteMany({ where: { recordId: { in: recordIds } } })
        await prisma.dnsRecord.deleteMany({ where: { zoneId: localZone.id } })
        await prisma.zone.delete({ where: { id: localZone.id } })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'DELETE_ZONE',
                `Zone: ${localZone.name}`
            )
        }

        return { success: true, message: 'Zone removed from TetherDNS successfully. Cloudflare records remain intact.' }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to delete zone'
        })
    }
})
