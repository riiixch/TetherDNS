import { prisma } from '../../../utils/prisma'
import { CloudflareAnalyticsService, CloudflarePermissionError } from '../../../services/CloudflareAnalyticsService'

export default defineEventHandler(async (event) => {
    const zoneIdParam = getRouterParam(event, 'id')
    if (!zoneIdParam) {
        throw createError({ statusCode: 400, statusMessage: 'Zone ID is required' })
    }

    const query = getQuery(event)
    const rawTimeRange = (query.timeRange as string) || '24h'
    const timeRange = (['24h', '7d', '30d'].includes(rawTimeRange) ? rawTimeRange : '24h') as '24h' | '7d' | '30d'
    const bypassCache = query.refresh === 'true' || query.refresh === '1'
    const isDemo = query.demo === 'true' || query.demo === '1'

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

        // If demo mode is explicitly requested, return mock data directly
        if (isDemo) {
            return {
                success: true,
                isDemo: true,
                data: CloudflareAnalyticsService.generateDemoAnalytics(zone.cfZoneId, timeRange),
                zone: {
                    id: zone.id,
                    name: zone.name,
                    cfZoneId: zone.cfZoneId
                }
            }
        }

        // Resolve Cloudflare Account
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
            const analytics = await CloudflareAnalyticsService.getZoneAnalytics(
                account,
                zone.cfZoneId,
                timeRange,
                bypassCache
            )

            return {
                success: true,
                data: analytics,
                zone: {
                    id: zone.id,
                    name: zone.name,
                    cfZoneId: zone.cfZoneId
                }
            }
        } catch (err: any) {
            if (err instanceof CloudflarePermissionError || CloudflareAnalyticsService.isPermissionError(err.message)) {
                // Return structured response indicating missing permission
                return {
                    success: false,
                    permissionRequired: true,
                    missingPermission: 'Zone > Analytics > Read',
                    accountLabel: account.label,
                    message: `Cloudflare API Token "${account.label}" lacks "Zone > Analytics > Read" permission.`,
                    data: CloudflareAnalyticsService.generateEmptyAnalytics(zone.cfZoneId, timeRange),
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
            statusMessage: error.message || 'Failed to fetch Cloudflare zone analytics'
        })
    }
})
