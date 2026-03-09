import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production'
    })

    if (!session.data.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({ where: { id: session.data.userId } })

    return {
        enabled: user?.twoFactorEnabled || false
    }
})
