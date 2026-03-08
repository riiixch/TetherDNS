import { prisma } from '../utils/prisma'
import { createCloudflareClient } from '../utils/cloudflare'
import { sendNotifications } from '../utils/notify'

export default defineNitroPlugin((nitroApp) => {
    let intervalId: NodeJS.Timeout
    let currentIntervalMs = 5 * 60 * 1000 // default 5 min

    const getIntervalFromSettings = async (): Promise<number> => {
        try {
            const setting = await prisma.settings.findUnique({ where: { key: 'ddns_interval_minutes' } })
            if (setting) {
                const minutes = parseInt(setting.value)
                if (!isNaN(minutes) && minutes >= 1 && minutes <= 60) {
                    return minutes * 60 * 1000
                }
            }
        } catch { /* use default */ }
        return 5 * 60 * 1000
    }

    const fetchCurrentIpv4 = async (): Promise<string | null> => {
        try {
            const res = await fetch('https://api.ipify.org?format=json')
            const data = await res.json()
            return data.ip || null
        } catch { return null }
    }

    const fetchCurrentIpv6 = async (): Promise<string | null> => {
        try {
            const res = await fetch('https://api64.ipify.org?format=json')
            const data = await res.json()
            const ip = data.ip || null
            // Verify it's actually IPv6 (contains :)
            if (ip && ip.includes(':')) return ip
            return null
        } catch { return null }
    }

    const runDDNSCheck = async () => {
        try {
            console.log('[DDNS Cron] Checking for IP updates...')

            // 1. Fetch current IPs
            const currentIpv4 = await fetchCurrentIpv4()
            const currentIpv6 = await fetchCurrentIpv6()

            if (!currentIpv4 && !currentIpv6) {
                console.error('[DDNS Cron] Failed to fetch any IP address.')
                return
            }

            console.log(`[DDNS Cron] Current IPv4: ${currentIpv4 || 'N/A'}, IPv6: ${currentIpv6 || 'N/A'}`)

            // 2. Fetch records that need auto-update
            const recordsToUpdate = await prisma.dnsRecord.findMany({
                where: { isAutoUpdate: true },
                include: { zone: { include: { account: true } } },
            })

            // 3. Compare and Update
            for (const record of recordsToUpdate) {
                // Determine which IP to use based on record type
                let targetIp: string | null = null
                if (record.type === 'A' && currentIpv4) {
                    targetIp = currentIpv4
                } else if (record.type === 'AAAA' && currentIpv6) {
                    targetIp = currentIpv6
                } else {
                    continue // Skip non-A/AAAA records or if IP not available
                }

                if (record.content !== targetIp) {
                    console.log(`[DDNS Cron] Updating ${record.type} record ${record.name}: ${record.content} → ${targetIp}`)

                    try {
                        if (!record.zone.accountId) {
                            console.warn(`[DDNS Cron] Skipping record ${record.name}: zone has no linked account.`)
                            continue
                        }
                        const cf = await createCloudflareClient(record.zone.accountId)

                        await cf.dns.records.edit(record.cfRecordId, {
                            zone_id: record.zone.cfZoneId,
                            type: record.type as any,
                            name: record.name,
                            content: targetIp,
                            proxied: record.proxied,
                        } as any)

                        await prisma.updateLog.create({
                            data: {
                                oldIp: record.content,
                                newIp: targetIp,
                                status: 'SUCCESS',
                                recordId: record.id,
                            },
                        })

                        await prisma.dnsRecord.update({
                            where: { id: record.id },
                            data: { content: targetIp },
                        })

                        console.log(`[DDNS Cron] Successfully updated ${record.name}`)
                        sendNotifications({
                            title: '✅ DDNS IP Updated',
                            message: `Record: ${record.name}\nOld IP: ${record.content}\nNew IP: ${targetIp}`,
                            color: 'success'
                        })
                    } catch (error: any) {
                        console.error(`[DDNS Cron] Error updating ${record.name}:`, error.message)

                        await prisma.updateLog.create({
                            data: {
                                oldIp: record.content,
                                newIp: targetIp,
                                status: 'FAILED',
                                recordId: record.id,
                            },
                        })
                        sendNotifications({
                            title: '❌ DDNS Update Failed',
                            message: `Record: ${record.name}\nError: ${error.message}`,
                            color: 'error'
                        })
                    }
                }
            }

            // 4. Check if interval changed
            const newInterval = await getIntervalFromSettings()
            if (newInterval !== currentIntervalMs) {
                console.log(`[DDNS Cron] Interval changed: ${currentIntervalMs / 60000}min → ${newInterval / 60000}min. Restarting...`)
                currentIntervalMs = newInterval
                clearInterval(intervalId)
                intervalId = setInterval(runDDNSCheck, currentIntervalMs)
            }
        } catch (error) {
            console.error('[DDNS Cron] Unexpected error:', error)
        }
    }

    const startCron = async () => {
        currentIntervalMs = await getIntervalFromSettings()
        console.log(`[DDNS Cron] Starting with interval: ${currentIntervalMs / 60000} minutes`)
        runDDNSCheck()
        intervalId = setInterval(runDDNSCheck, currentIntervalMs)
    }

    startCron()

    nitroApp.hooks.hook('close', () => {
        if (intervalId) clearInterval(intervalId)
    })
})
