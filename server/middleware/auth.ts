import { getUserSession } from '../utils/session'
import { prisma } from '../utils/prisma'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
    // Get the generic requested path
    const url = getRequestURL(event)

    // We only protect API routes
    if (!url.pathname.startsWith('/api/')) return

    // Allow unrestricted access to the authentication endpoints
    if (url.pathname.startsWith('/api/auth/')) return

    // Allow external DDNS client updates with query token
    if (url.pathname === '/api/ddns/update') return

    // 1. Check for API Bearer Token
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.slice(7).trim()
        if (rawToken) {
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
            const apiToken = await prisma.apiToken.findUnique({
                where: { tokenHash },
                include: { user: true }
            })
            if (apiToken) {
                // Update lastUsedAt asynchronously
                prisma.apiToken.update({
                    where: { id: apiToken.id },
                    data: { lastUsedAt: new Date() }
                }).catch(() => {})

                event.context.userId = apiToken.userId
                event.context.user = apiToken.user
                return
            }
        }
    }

    // 2. Check for Web Session Cookie
    const session = await getUserSession(event)

    // If there's no userId in session, the user is unauthenticated
    if (!session.data.userId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized. Please login or provide a valid API token.'
        })
    }

    // Attach userId to event context
    event.context.userId = session.data.userId
})
