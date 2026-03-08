import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    try {
        const records = await prisma.dnsRecord.findMany({
            include: {
                zone: true
            }
        })

        // Structure the export data nicely
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalRecords: records.length,
            records: records.map(r => ({
                id: r.id,
                cfRecordId: r.cfRecordId,
                name: r.name,
                type: r.type,
                content: r.content,
                proxied: r.proxied,
                isAutoUpdate: r.isAutoUpdate,
                zone: r.zone.name,
                cfZoneId: r.zone.cfZoneId
            }))
        }

        // Return as a downloadable JSON file
        setHeader(event, 'Content-Disposition', 'attachment; filename="cloudflare-ddns-export.json"')
        setHeader(event, 'Content-Type', 'application/json')

        return exportData
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to export records' })
    }
})
