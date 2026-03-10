import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

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
