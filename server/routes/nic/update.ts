import { prisma } from '../../utils/prisma'
import { createCloudflareClient } from '../../utils/cloudflare'
import { sendNotifications } from '../../utils/sendNotifications'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

    const query = getQuery(event)
    const hostname = (query.hostname as string || '').trim()
    const myip = (query.myip as string || '').trim()

    if (!hostname) {
        return 'notfqdn'
    }

    // 1. Authenticate Request
    const authHeader = getHeader(event, 'authorization')
    let authenticatedUser: any = null
    let authValid = false

    if (authHeader && authHeader.startsWith('Basic ')) {
        try {
            const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
            const [username, password] = credentials.split(':')

            if (username && password) {
                // Check 1: User credentials
                const user = await prisma.user.findUnique({ where: { username } })
                if (user && await bcrypt.compare(password, user.password)) {
                    authenticatedUser = user
                    authValid = true
                } else {
                    // Check 2: API Token (token hash)
                    const tokenHash = crypto.createHash('sha256').update(password).digest('hex')
                    const apiToken = await prisma.apiToken.findUnique({
                        where: { tokenHash },
                        include: { user: true }
                    })
                    if (apiToken) {
                        authenticatedUser = apiToken.user
                        authValid = true
                        prisma.apiToken.update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
                    }
                }
            }
        } catch {
            return 'badauth'
        }
    } else if (query.password || query.token) {
        // Fallback: Query parameter token
        const rawToken = (query.password || query.token) as string
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const apiToken = await prisma.apiToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        })
        if (apiToken) {
            authenticatedUser = apiToken.user
            authValid = true
        }
    }

    if (!authValid) {
        return 'badauth'
    }

    // 2. Resolve Client IP (handle reverse proxies, Cloudflare, and forwarded chains)
    let clientIp = myip || 
        getHeader(event, 'cf-connecting-ip') || 
        getHeader(event, 'x-real-ip') || 
        getRequestIP(event, { xForwardedFor: true }) || ''

    if (clientIp.includes(',')) {
        clientIp = (clientIp.split(',')[0] || '').trim()
    }
    clientIp = clientIp.trim()

    // Validate IP format
    const isV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(clientIp)
    const isV6 = /^[a-fA-F0-9:]+$/.test(clientIp) && clientIp.includes(':')

    if (!isV4 && !isV6) {
        return 'badagent'
    }

    // 3. Find Matching Record (clean trailing dots if sent by router)
    const cleanHostname = hostname.replace(/\.+$/, '')
    const record = await prisma.dnsRecord.findFirst({
        where: {
            OR: [
                { name: cleanHostname },
                { name: `${cleanHostname}.` }
            ],
            type: isV6 ? 'AAAA' : 'A'
        },
        include: {
            zone: {
                include: { account: true }
            },
            healthCheck: true
        }
    })

    if (!record) {
        return 'nohost'
    }

    // If failover is active, preserve Cloudflare backup IP and update snapshot
    if (record.healthCheck?.enabled && record.healthCheck?.currentStatus === 'FAILOVER_ACTIVE') {
        if (record.healthCheck.originalIp !== clientIp) {
            await prisma.healthCheck.update({
                where: { id: record.healthCheck.id },
                data: { originalIp: clientIp }
            })
        }
        return `good ${clientIp}`
    }

    // 4. Check if already up to date
    if (record.content === clientIp) {
        return `nochg ${clientIp}`
    }

    // 5. Update Cloudflare Edge
    try {
        if (!record.zone.accountId) {
            return '911'
        }

        const cf = await createCloudflareClient(record.zone.accountId)

        await cf.dns.records.edit(record.cfRecordId, {
            zone_id: record.zone.cfZoneId,
            type: record.type as 'A' | 'AAAA',
            name: record.name,
            content: clientIp,
            proxied: record.proxied,
            ttl: 1
        })

        // Update local database
        await prisma.dnsRecord.update({
            where: { id: record.id },
            data: { content: clientIp }
        })

        await prisma.updateLog.create({
            data: {
                oldIp: record.content,
                newIp: clientIp,
                status: 'SUCCESS',
                message: `Updated via DynDNS v2 router protocol (${hostname})`,
                recordId: record.id
            }
        })

        // Send multi-channel notification
        sendNotifications({
            title: '🌐 Router DDNS Updated',
            message: `Record ${record.name} updated via router standard protocol.`,
            color: 'success',
            eventType: 'DDNS',
            fields: [
                { name: 'Hostname', value: record.name },
                { name: 'Old IP', value: record.content },
                { name: 'New IP', value: clientIp }
            ]
        }).catch(() => {})

        return `good ${clientIp}`
    } catch (e: any) {
        console.error('[Router DDNS] Update error:', e.message)
        await prisma.updateLog.create({
            data: {
                oldIp: record.content,
                newIp: clientIp,
                status: 'FAILED',
                message: `Router DDNS error: ${e.message}`,
                recordId: record.id
            }
        })
        return '911'
    }
})
