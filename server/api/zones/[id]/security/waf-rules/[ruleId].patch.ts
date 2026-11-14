import { prisma } from '../../../../../utils/prisma'
import { CloudflareSecurityService } from '../../../../../services/CloudflareSecurityService'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    const ruleId = getRouterParam(event, 'ruleId')

    if (!zoneIdParam || !ruleId) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID and Rule ID are required' })
    }

    const body = await readBody(event)
    if (!body || body.enabled === undefined || !body.rulesetId) {
        throw createError({ statusCode: 400, statusMessage: 'Ruleset ID and enabled state are required' })
    }

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
        await CloudflareSecurityService.toggleWafRule(
            account,
            zone,
            body.rulesetId,
            ruleId,
            body.enabled === true,
            user
        )

        return {
            success: true,
            ruleId,
            enabled: body.enabled === true
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to toggle WAF rule'
        })
    }
})
