import { prisma } from '../utils/prisma'
import { sendNotifications } from '../utils/sendNotifications'

export default defineNitroPlugin((nitroApp) => {
    let intervalId: NodeJS.Timeout

    const runHealthChecks = async () => {
        try {
            const checks = await prisma.healthCheck.findMany({
                where: { isEnabled: true }
            })

            for (const check of checks) {
                const startTime = Date.now()
                let status = 'DOWN'
                let message = ''
                let responseTime = 0

                try {
                    if (check.type === 'PING') {
                        // In a real environment we might use a ping library, 
                        // but for simplicity in this sandbox we'll use a fetch attempt if it's a URL/IP
                        const res = await fetch(`http://${check.target}`, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
                        if (res.ok || res.status < 500) status = 'UP'
                    } else {
                        const res = await fetch(check.target, { method: 'GET', signal: AbortSignal.timeout(10000) })
                        if (res.ok) status = 'UP'
                        else message = `HTTP ${res.status}`
                    }
                } catch (e: any) {
                    message = e.message
                }

                responseTime = Date.now() - startTime

                // Log result
                await prisma.healthCheckLog.create({
                    data: {
                        healthCheckId: check.id,
                        status,
                        responseTime,
                        message: message.substring(0, 255)
                    }
                })

                // Notify if status changed to DOWN
                if (status === 'DOWN' && check.lastStatus === 'UP') {
                    sendNotifications({
                        title: `🚨 Monitor Alert: ${check.name} is DOWN`,
                        message: `Target: ${check.target}\nError: ${message}`,
                        color: 'error'
                    })
                } else if (status === 'UP' && check.lastStatus === 'DOWN') {
                    sendNotifications({
                        title: `✅ Monitor Recovery: ${check.name} is UP`,
                        message: `Target: ${check.target}\nResponse Time: ${responseTime}ms`,
                        color: 'success'
                    })
                }

                // Update health check status
                await prisma.healthCheck.update({
                    where: { id: check.id },
                    data: {
                        lastStatus: status,
                        lastCheckAt: new Date()
                    }
                })
            }
        } catch (error) {
            console.error('[Monitoring Cron] Error:', error)
        }
    }

    // Run every 5 minutes (standard internal)
    // In a more complex system, we'd handle individual intervals, 
    // but for this MVP we'll run all enabled checks every 5 min.
    intervalId = setInterval(runHealthChecks, 5 * 60 * 1000)

    // Run once on start
    setTimeout(runHealthChecks, 10000)

    nitroApp.hooks.hook('close', () => {
        if (intervalId) clearInterval(intervalId)
    })
})
