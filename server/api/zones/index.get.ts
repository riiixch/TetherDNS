import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'

export default defineEventHandler(async () => {
    try {
        // Get all accounts
        const accounts = await prisma.cloudflareAccount.findMany()

        // Sync zones from each Cloudflare account
        for (const account of accounts) {
            try {
                const cf = await createCloudflareClient(account.id)
                const cfZones = await cf.zones.list()

                for (const zone of cfZones.result) {
                    if (!zone.id || !zone.name) continue

                    await prisma.zone.upsert({
                        where: { cfZoneId: zone.id },
                        update: { name: zone.name },
                        create: { cfZoneId: zone.id, name: zone.name, accountId: account.id }
                    })
                }
            } catch (err: any) {
                console.warn(`[Zones Sync] Failed to sync account "${account.label}":`, err.message)
            }
        }

        // Return all zones from database
        const zones = await prisma.zone.findMany({
            include: {
                account: { select: { id: true, label: true } },
                _count: { select: { records: true } }
            }
        })

        return { success: true, data: zones }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
