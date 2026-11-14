import { prisma } from '../../../../utils/prisma'
import { logAudit } from '../../../../utils/audit'
import { createCloudflareClient } from '../../../../utils/cloudflare'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })

    const body = await readBody(event)
    const recordId = parseInt(id)

    try {
        const record = await prisma.dnsRecord.findUnique({
            where: { id: recordId },
            include: { zone: true }
        })
        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })

        const trimmedBackup = body.backupIp ? String(body.backupIp).trim() : ''
        const trimmedTarget = body.probeTarget ? String(body.probeTarget).trim() : record.name

        const isEnabled = body.enabled !== undefined ? Boolean(body.enabled) : true

        if (isEnabled && trimmedBackup) {
            const isV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedBackup)
            const isV6 = /^[a-fA-F0-9:]+$/.test(trimmedBackup) && trimmedBackup.includes(':')
            if (!isV4 && !isV6) {
                throw createError({ statusCode: 400, statusMessage: 'Backup IP must be a valid IPv4 or IPv6 address' })
            }
        }

        const data: any = {
            enabled: isEnabled,
            probeType: body.probeType || 'HTTP',
            probeTarget: trimmedTarget,
            expectedStatus: body.expectedStatus ? parseInt(body.expectedStatus) : 200,
            intervalSeconds: body.intervalSeconds ? parseInt(body.intervalSeconds) : 60,
            timeoutSeconds: body.timeoutSeconds ? parseInt(body.timeoutSeconds) : 5,
            failureThreshold: body.failureThreshold ? parseInt(body.failureThreshold) : 3,
            successThreshold: body.successThreshold ? parseInt(body.successThreshold) : 2,
            backupIp: trimmedBackup,
            backupProxied: body.backupProxied !== undefined ? Boolean(body.backupProxied) : true,
            autoFailback: body.autoFailback !== undefined ? Boolean(body.autoFailback) : true
        }

        // Safety Guard: If user disables healthcheck while failover was active, revert Cloudflare to primary IP!
        const existingHc = await prisma.healthCheck.findUnique({ where: { recordId } })
        if (!isEnabled && existingHc?.currentStatus === 'FAILOVER_ACTIVE' && existingHc.originalIp) {
            if (record.zone?.accountId) {
                try {
                    const cf = await createCloudflareClient(record.zone.accountId)
                    const restoreProxied = existingHc.originalProxied ?? record.proxied
                    await cf.dns.records.edit(record.cfRecordId, {
                        zone_id: record.zone.cfZoneId,
                        type: record.type as 'A' | 'AAAA',
                        name: record.name,
                        content: existingHc.originalIp,
                        proxied: restoreProxied,
                        ttl: 1
                    })
                    await prisma.dnsRecord.update({
                        where: { id: record.id },
                        data: { content: existingHc.originalIp, proxied: restoreProxied }
                    })
                } catch (cfErr: any) {
                    console.error('[HealthCheck Post] Failed to revert DNS on disable:', cfErr.message)
                }
            }
            data.currentStatus = 'HEALTHY'
            data.originalIp = null
            data.originalProxied = null
        }

        const healthCheck = await prisma.healthCheck.upsert({
            where: { recordId },
            update: data,
            create: {
                recordId,
                ...data
            }
        })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'UPDATE_HEALTHCHECK',
                `Record: ${record.name}`,
                { probeType: data.probeType, backupIp: data.backupIp, enabled: data.enabled }
            )
        }

        return {
            success: true,
            data: healthCheck,
            message: 'Health check configured successfully.'
        }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to save health check' })
    }
})
