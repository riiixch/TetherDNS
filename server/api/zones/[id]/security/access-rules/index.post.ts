import { prisma } from '../../../../../utils/prisma'
import { CloudflareSecurityService } from '../../../../../services/CloudflareSecurityService'
import type { AccessRuleMode, AccessRuleTarget } from '~~/types/security'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    if (!zoneIdParam) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID is required' })
    }

    const body = await readBody(event)
    if (!body || !body.mode || !body.target || !body.value) {
        throw createError({ statusCode: 400, statusMessage: 'Mode, target and value are required' })
    }

    const validModes: AccessRuleMode[] = ['block', 'challenge', 'whitelist', 'js_challenge', 'managed_challenge']
    const validTargets: AccessRuleTarget[] = ['ip', 'ip_range', 'asn', 'country']

    if (!validModes.includes(body.mode)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid mode: ${body.mode}` })
    }
    if (!validTargets.includes(body.target)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid target: ${body.target}` })
    }

    if (body.target === 'country' && body.value.trim().length !== 2) {
        throw createError({ statusCode: 400, statusMessage: 'Country code must be a 2-letter ISO code (e.g. TH, US)' })
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
        const rule = await CloudflareSecurityService.createAccessRule(
            account,
            zone,
            {
                mode: body.mode,
                target: body.target,
                value: body.value,
                notes: body.notes
            },
            user
        )

        return {
            success: true,
            data: rule,
            zone: {
                id: zone.id,
                name: zone.name,
                cfZoneId: zone.cfZoneId
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to create firewall access rule'
        })
    }
})
