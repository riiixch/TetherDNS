import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    await session.clear()

    return {
        success: true,
        message: 'Logged out successfully'
    }
})
