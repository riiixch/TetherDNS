export default defineEventHandler(async (event) => {
    // Get the generic requested path
    const url = getRequestURL(event)

    // We only protect API routes
    if (!url.pathname.startsWith('/api/')) return

    // Allow unrestricted access to the authentication endpoints
    if (url.pathname.startsWith('/api/auth/')) return

    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production'
    })

    // If there's no userId in session, the user is unauthenticated
    if (!session.data.userId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized. Please login to access this endpoint.'
        })
    }

    // Attach userId to event context
    event.context.userId = session.data.userId
})
