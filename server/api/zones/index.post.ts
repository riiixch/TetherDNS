import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.name || !body.accountId) {
        throw createError({ statusCode: 400, statusMessage: 'Domain name and accountId are required' })
    }

    try {
        const cf = await createCloudflareClient(body.accountId)

        // Fetch the Cloudflare Account ID
        const accounts = await cf.accounts.list()
        if (!accounts || !(accounts.result as any[]) || (accounts.result as any[]).length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'No Cloudflare Account found associated with this API Token.' })
        }
        const cfAccountId = (accounts.result as any[])[0].id

        // Create Zone on Cloudflare
        const newZone = await cf.zones.create({
            account: { id: cfAccountId },
            name: body.name,
            type: 'full'
        })

        if (!newZone.id || !newZone.name) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve created zone details from Cloudflare.' })
        }

        // Save to local Database
        const dbZone = await prisma.zone.create({
            data: {
                cfZoneId: newZone.id,
                name: newZone.name,
                accountId: body.accountId
            }
        })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'ADD_ZONE',
                `Zone: ${newZone.name}`,
                { accountId: body.accountId, cfZoneId: newZone.id }
            )
        }

        return { success: true, data: dbZone, message: 'Zone created successfully' }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to create zone'
        })
    }
})
