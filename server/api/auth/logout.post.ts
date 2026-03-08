export default defineEventHandler(async (event) => {
    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production'
    })

    await session.clear()

    return {
        success: true,
        message: 'Logged out successfully'
    }
})
