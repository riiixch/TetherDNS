import { prisma } from '../../../../utils/prisma'
import { CloudflareSecurityService } from '../../../../services/CloudflareSecurityService'
import type { SecurityLevel } from '~~/types/security'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    if (!zoneIdParam) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID is required' })
    }

    const body = await readBody(event)
    if (!body) {
        throw createError({ statusCode: 400, statusMessage: 'Request body is required' })
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
        const rawIp = getRequestHeader(event, 'x-forwarded-for') || event.node?.req?.socket?.remoteAddress || ''
        const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : String(rawIp)

        let updatedSettings
        if (body.securityLevel) {
            const validLevels: SecurityLevel[] = ['essentially_off', 'low', 'medium', 'high', 'under_attack']
            if (!validLevels.includes(body.securityLevel)) {
                throw createError({ statusCode: 400, statusMessage: 'Invalid security level' })
            }
            updatedSettings = await CloudflareSecurityService.updateSecurityLevel(
                account,
                zone,
                body.securityLevel,
                user,
                clientIp
            )
        }

        if (body.challengeTtl !== undefined || body.browserCheck !== undefined) {
            if (body.browserCheck !== undefined && !['on', 'off'].includes(body.browserCheck)) {
                throw createError({ statusCode: 400, statusMessage: 'browserCheck must be on or off' })
            }
            updatedSettings = await CloudflareSecurityService.updateGeneralSettings(
                account,
                zone,
                {
                    challengeTtl: body.challengeTtl !== undefined ? parseInt(String(body.challengeTtl), 10) : undefined,
                    browserCheck: body.browserCheck
                },
                user
            )
        }

        if (!updatedSettings) {
            updatedSettings = await CloudflareSecurityService.getSecuritySettings(account, zone.cfZoneId)
        }

        return {
            success: true,
            data: updatedSettings,
            zone: {
                id: zone.id,
                name: zone.name,
                cfZoneId: zone.cfZoneId
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to update security settings'
        })
    }
})
