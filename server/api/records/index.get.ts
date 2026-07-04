import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const cfZoneId = query.cfZoneId as string | undefined

    if (!cfZoneId) {
        throw createError({ statusCode: 400, statusMessage: 'cfZoneId query parameter is required' })
    }

    try {
        // Find the zone and its account
        const zone = await prisma.zone.findUnique({ where: { cfZoneId } })
        if (!zone) throw createError({ statusCode: 404, statusMessage: 'Zone not found' })
        if (!zone.accountId) throw createError({ statusCode: 400, statusMessage: 'Zone has no linked account' })

        // Sync from Cloudflare
        const cf = await createCloudflareClient(zone.accountId)
        const cfRecords = await cf.dns.records.list({ zone_id: cfZoneId })

        const relevantRecords = cfRecords.result
        const cfRecordIds = new Set(relevantRecords.map(r => r.id).filter(Boolean))

        // Get all local records currently stored for this zone
        const localRecords = await prisma.dnsRecord.findMany({
            where: { zoneId: zone.id }
        })

        // 1. Delete local records that are no longer present on Cloudflare
        const recordsToDelete = localRecords.filter(r => !cfRecordIds.has(r.cfRecordId))
        for (const localRec of recordsToDelete) {
            await prisma.updateLog.deleteMany({ where: { recordId: localRec.id } })
            await prisma.dnsRecord.delete({ where: { id: localRec.id } })
        }

        // 2. Upsert existing records from Cloudflare
        for (const record of relevantRecords) {
            if (!record.id || !record.name || !record.type || !record.content) continue

            // If record exists, we update it but preserve the routingMode/tunnelId/token
            await prisma.dnsRecord.upsert({
                where: { cfRecordId: record.id },
                update: {
                    name: record.name,
                    type: record.type,
                    content: record.content,
                    proxied: record.proxied ?? false,
                },
                create: {
                    cfRecordId: record.id,
                    name: record.name,
                    type: record.type,
                    content: record.content,
                    proxied: record.proxied ?? false,
                    zoneId: zone.id
                }
            })
        }

        // Return from DB
        const records = await prisma.dnsRecord.findMany({
            where: { zoneId: zone.id },
            include: { zone: true },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: records }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message
        })
    }
})
