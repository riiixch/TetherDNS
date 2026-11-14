import { prisma } from '../../../../../utils/prisma'
import { CloudflareSecurityService } from '../../../../../services/CloudflareSecurityService'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    if (!zoneIdParam) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID is required' })
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

        try {
            const rules = await CloudflareSecurityService.listWafRules(account, zone.cfZoneId)
            return {
                success: true,
                data: rules,
                zone: {
                    id: zone.id,
                    name: zone.name,
                    cfZoneId: zone.cfZoneId
                }
            }
        } catch (err: any) {
            if (CloudflareSecurityService.isPermissionError(err.message)) {
                return {
                    success: false,
                    permissionRequired: true,
                    missingPermission: 'Zone > Firewall Services > Read / Edit',
                    accountLabel: account.label,
                    message: `Cloudflare API Token "${account.label}" lacks "Zone > Firewall Services" permission.`,
                    data: [],
                    zone: {
                        id: zone.id,
                        name: zone.name,
                        cfZoneId: zone.cfZoneId
                    }
                }
            }
            throw err
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to list WAF rules'
        })
    }
})
