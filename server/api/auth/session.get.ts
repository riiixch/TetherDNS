export default defineEventHandler(async (event) => {
    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    if (session.data.userId) {
        return {
            success: true,
            user: {
                id: session.data.userId,
                username: session.data.username
            }
        }
    }

    return {
        success: false,
        user: null
    }
})
