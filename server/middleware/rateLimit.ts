export default defineEventHandler(async (event) => {
    const url = getRequestURL(event).pathname

    // Limits config
    let maxAttempts = 0
    let banMinutes = 0
    let storageKey = ''
    let identifyByClient = ''

    if (url === '/api/auth/login' && event.method === 'POST') {
        maxAttempts = 10
        banMinutes = 1 // Ban for 15 minutes after 5 failed login attempts
        storageKey = 'cache:rate-limit:login'
        identifyByClient = getRequestIP(event, { xForwardedFor: true }) || 'unknown-ip'
    } else if (url === '/api/ddns/update' || (url.startsWith('/api/records') && url.endsWith('/token'))) {
        maxAttempts = 10
        banMinutes = 1 // 10 requests per minute
        storageKey = 'cache:rate-limit:ddns'
        identifyByClient = getRequestIP(event, { xForwardedFor: true }) || 'unknown-ip'
    }

    if (!maxAttempts) return // Not a rate-limited route

    const storage = useStorage(storageKey)
    const key = `id:${identifyByClient}`

    const currentData: any = await storage.getItem(key)
    const now = Date.now()

    if (currentData) {
        // If currently banned
        if (currentData.bannedUntil && now < currentData.bannedUntil) {
            const waitSec = Math.ceil((currentData.bannedUntil - now) / 1000)
            setResponseHeader(event, 'Retry-After', waitSec)
            throw createError({ statusCode: 429, statusMessage: `Too many attempts, try again in ${waitSec} seconds.` })
        }

        // Reset phase
        if (now > (currentData.resetAt || 0)) {
            await storage.setItem(key, { attempts: 1, resetAt: now + banMinutes * 60 * 1000 })
        } else {
            // Increment
            currentData.attempts++
            if (currentData.attempts >= maxAttempts) {
                const bannedUntil = now + banMinutes * 60 * 1000
                await storage.setItem(key, { bannedUntil, resetAt: bannedUntil })
                setResponseHeader(event, 'Retry-After', (banMinutes * 60))
                throw createError({ statusCode: 429, statusMessage: `Rate limit exceeded.` })
            }
            await storage.setItem(key, currentData)
        }
    } else {
        await storage.setItem(key, { attempts: 1, resetAt: now + banMinutes * 60 * 1000 })
    }
})
