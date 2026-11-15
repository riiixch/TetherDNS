import { prisma } from '../../../../../utils/prisma'
import { CloudflareSecurityService } from '../../../../../services/CloudflareSecurityService'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    const ruleId = getRouterParam(event, 'ruleId')

    if (!zoneIdParam || !ruleId) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID and Rule ID are required' })
    }

    const query = getQuery(event)
    const rulesetId = (query.rulesetId as string) || undefined

    try {
        const isNumeric = /^\d+$/.test(zoneIdParam)
        const zone = isNumeric
            ? await prisma.zone.findFirst({
                where: { OR: [{ id: parseInt(zoneIdParam, 10) }, { cfZoneId: zoneIdParam }] },
                include: { account: true }
            })
            : await prisma.zone.findUnique({
                where: { cfZoneId: zoneIdParam },
                include: { account: true }
            })

        if (!zone) {
            throw createError({ statusCode: 404, statusMessage: 'Zone not found' })
        }

        let account = zone.account
        if (!account && zone.accountId) {
            account = await prisma.cloudflareAccount.findUnique({ where: { id: zone.accountId } })
        }
        if (!account) {
            account = await prisma.cloudflareAccount.findFirst()
        }

        if (!account) {
            throw createError({
                statusCode: 400,
                statusMessage: 'No Cloudflare account configured for this zone'
            })
        }

        const user = event.context.user
        await CloudflareSecurityService.deleteWafRule(
            account,
            zone,
            rulesetId,
            ruleId,
            user
        )

        return {
            success: true,
            ruleId
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to delete WAF rule'
        })
    }
})
