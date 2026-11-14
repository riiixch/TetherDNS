import { prisma } from '../utils/prisma'
import { ProbeService } from '../services/ProbeService'
import { createCloudflareClient } from '../utils/cloudflare'
import { sendNotifications } from '../utils/sendNotifications'
import { getGlobalIp } from '../utils/getGlobalIp'

export default defineNitroPlugin((nitroApp) => {
    let intervalId: NodeJS.Timeout
    let isRunning = false

    const runHealthChecks = async () => {
        if (isRunning) return
        isRunning = true

        try {
            const checks = await prisma.healthCheck.findMany({
                where: { enabled: true },
                include: {
                    record: {
                        include: {
                            zone: { include: { account: true } }
                        }
                    }
                }
            })

            const now = new Date()

            for (const check of checks) {
                // Check interval condition
                if (check.lastCheckAt) {
                    const elapsedSec = Math.floor((now.getTime() - check.lastCheckAt.getTime()) / 1000)
                    if (elapsedSec < check.intervalSeconds) {
                        continue
                    }
                }

                try {
                    const result = await ProbeService.executeProbe({
                        probeType: check.probeType,
                        probeTarget: check.probeTarget,
                        expectedStatus: check.expectedStatus,
                        timeoutSeconds: check.timeoutSeconds
                    })

                    // Log history
                    await prisma.healthCheckLog.create({
                        data: {
                            healthCheckId: check.id,
                            status: result.success ? 'PASS' : 'FAIL',
                            statusCode: result.statusCode,
                            latencyMs: result.latencyMs,
                            errorMessage: result.errorMessage
                        }
                    })

                    // Clean old logs (keep last 100 per check)
                    const count = await prisma.healthCheckLog.count({ where: { healthCheckId: check.id } })
                    if (count > 120) {
                        const oldest = await prisma.healthCheckLog.findMany({
                            where: { healthCheckId: check.id },
                            orderBy: { createdAt: 'asc' },
                            take: count - 100,
                            select: { id: true }
                        })
                        await prisma.healthCheckLog.deleteMany({
                            where: { id: { in: oldest.map(o => o.id) } }
                        })
                    }

                    if (result.success) {
                        const newPasses = check.consecutivePasses + 1
                        const isRecoveredFromFailover = check.currentStatus === 'FAILOVER_ACTIVE' && check.autoFailback && newPasses >= check.successThreshold

                        if (isRecoveredFromFailover) {
                            console.log(`[HealthCheck] Service recovered for ${check.record.name}! Initiating failback...`)

                            // Determine primary IP & Proxied state from saved snapshot
                            let primaryIp = check.originalIp || check.record.content
                            const primaryProxied = check.originalProxied !== null && check.originalProxied !== undefined
                                ? check.originalProxied
                                : check.record.proxied

                            if (check.record.isAutoUpdate) {
                                const detected = await getGlobalIp(check.record.type === 'AAAA')
                                if (detected) primaryIp = detected
                            }

                            // Restore on Cloudflare
                            if (check.record.zone.accountId && primaryIp) {
                                const cf = await createCloudflareClient(check.record.zone.accountId)
                                await cf.dns.records.edit(check.record.cfRecordId, {
                                    zone_id: check.record.zone.cfZoneId,
                                    type: check.record.type as 'A' | 'AAAA',
                                    name: check.record.name,
                                    content: primaryIp,
                                    proxied: primaryProxied,
                                    ttl: 1
                                })

                                await prisma.dnsRecord.update({
                                    where: { id: check.record.id },
                                    data: { content: primaryIp, proxied: primaryProxied }
                                })
                            }

                            await prisma.healthCheck.update({
                                where: { id: check.id },
                                data: {
                                    currentStatus: 'HEALTHY',
                                    consecutiveFails: 0,
                                    consecutivePasses: newPasses,
                                    lastCheckAt: now,
                                    lastLatencyMs: result.latencyMs,
                                    originalIp: null,
                                    originalProxied: null
                                }
                            })

                            sendNotifications({
                                title: '🟢 Service Recovered & Failback Complete',
                                message: `Primary service ${check.record.name} is healthy again. Traffic restored to primary endpoint.`,
                                color: 'success',
                                eventType: 'RECOVERY',
                                fields: [
                                    { name: 'Record', value: check.record.name },
                                    { name: 'Status', value: 'HEALTHY' },
                                    { name: 'Restored IP', value: primaryIp },
                                    { name: 'Latency', value: `${result.latencyMs}ms` }
                                ]
                            }).catch(() => {})
                        } else {
                            await prisma.healthCheck.update({
                                where: { id: check.id },
                                data: {
                                    currentStatus: check.currentStatus === 'FAILOVER_ACTIVE' ? 'FAILOVER_ACTIVE' : 'HEALTHY',
                                    consecutiveFails: 0,
                                    consecutivePasses: newPasses,
                                    lastCheckAt: now,
                                    lastLatencyMs: result.latencyMs
                                }
                            })
                        }
                    } else {
                        // Failed probe
                        const newFails = check.consecutiveFails + 1
                        const shouldTriggerFailover = check.currentStatus !== 'FAILOVER_ACTIVE' && newFails >= check.failureThreshold

                        if (shouldTriggerFailover && check.backupIp) {
                            console.warn(`[HealthCheck] Failure threshold reached for ${check.record.name}! Triggering failover to ${check.backupIp}...`)

                            // Preserve primary IP & Proxied state before failover
                            const primaryIpToSave = check.originalIp || check.record.content
                            const primaryProxiedToSave = check.originalProxied !== null && check.originalProxied !== undefined
                                ? check.originalProxied
                                : check.record.proxied

                            if (check.record.zone.accountId) {
                                const cf = await createCloudflareClient(check.record.zone.accountId)
                                await cf.dns.records.edit(check.record.cfRecordId, {
                                    zone_id: check.record.zone.cfZoneId,
                                    type: check.record.type as 'A' | 'AAAA',
                                    name: check.record.name,
                                    content: check.backupIp,
                                    proxied: check.backupProxied,
                                    ttl: 1
                                })

                                await prisma.dnsRecord.update({
                                    where: { id: check.record.id },
                                    data: { content: check.backupIp }
                                })
                            }

                            await prisma.healthCheck.update({
                                where: { id: check.id },
                                data: {
                                    currentStatus: 'FAILOVER_ACTIVE',
                                    consecutiveFails: newFails,
                                    consecutivePasses: 0,
                                    lastCheckAt: now,
                                    lastFailoverAt: now,
                                    lastLatencyMs: result.latencyMs,
                                    originalIp: primaryIpToSave,
                                    originalProxied: primaryProxiedToSave
                                }
                            })

                            sendNotifications({
                                title: '🚨 Service Outage: Failover Activated',
                                message: `Probe failed ${newFails} times for ${check.record.name}. Traffic automatically routed to backup IP (${check.backupIp}).`,
                                color: 'error',
                                eventType: 'FAILOVER',
                                fields: [
                                    { name: 'Record', value: check.record.name },
                                    { name: 'Error', value: result.errorMessage || 'Timeout' },
                                    { name: 'Backup IP', value: check.backupIp }
                                ]
                            }).catch(() => {})
                        } else {
                            await prisma.healthCheck.update({
                                where: { id: check.id },
                                data: {
                                    currentStatus: check.currentStatus === 'FAILOVER_ACTIVE' ? 'FAILOVER_ACTIVE' : (newFails > 1 ? 'DEGRADED' : 'HEALTHY'),
                                    consecutiveFails: newFails,
                                    consecutivePasses: 0,
                                    lastCheckAt: now,
                                    lastLatencyMs: result.latencyMs
                                }
                            })
                        }
                    }
                } catch (checkErr: any) {
                    console.error(`[HealthCheck] Error checking ${check.record.name}:`, checkErr.message)
                }
            }
        } catch (err: any) {
            console.error('[HealthCheck] Global loop error:', err.message)
        } finally {
            isRunning = false
        }
    }

    // Run health check loop every 15 seconds
    intervalId = setInterval(runHealthChecks, 15000)

    nitroApp.hooks.hook('close', () => {
        if (intervalId) clearInterval(intervalId)
    })
})
