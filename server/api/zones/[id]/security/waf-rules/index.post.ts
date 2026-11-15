import { prisma } from '../../../../../utils/prisma'
import { CloudflareSecurityService } from '../../../../../services/CloudflareSecurityService'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    if (!zoneIdParam) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID is required' })
    }

    const body = await readBody(event)
    if (!body || !body.description || !body.expression || !body.action) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Description, expression, and action are required'
        })
    }

    const validActions = ['block', 'challenge', 'managed_challenge', 'js_challenge', 'log']
    if (!validActions.includes(body.action)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid action "${body.action}". Must be one of: ${validActions.join(', ')}`
        })
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
        const newRule = await CloudflareSecurityService.createWafRule(
            account,
            zone,
            {
                description: String(body.description).trim(),
                expression: String(body.expression).trim(),
                action: body.action,
                enabled: body.enabled !== false
            },
            user
        )

        return {
            success: true,
            data: newRule
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to create WAF rule'
        })
    }
})
