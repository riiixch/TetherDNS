import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const accountId = body.accountId as number | undefined

    if (!accountId) {
        throw createError({ statusCode: 400, statusMessage: 'accountId is required' })
    }

    try {
        const account = await prisma.cloudflareAccount.findUnique({ where: { id: accountId } })
        if (!account) throw createError({ statusCode: 404, statusMessage: 'Account not found' })

        const cf = await createCloudflareClient(accountId)
        const cfZones = await cf.zones.list()

        let imported = 0
        for (const z of cfZones.result) {
            if (!z.id || !z.name) continue

            await prisma.zone.upsert({
                where: { cfZoneId: z.id },
                update: { name: z.name, accountId },
                create: { cfZoneId: z.id, name: z.name, accountId }
            })
            imported++
        }

        return { success: true, message: `Imported ${imported} zones from "${account.label}"`, count: imported }
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message })
    }
})
