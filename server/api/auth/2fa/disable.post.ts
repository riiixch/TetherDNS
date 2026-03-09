import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production'
    })

    if (!session.data.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { token } = body

    if (!token) {
        throw createError({ statusCode: 400, statusMessage: 'Token is required' })
    }

    const user = await prisma.user.findUnique({ where: { id: session.data.userId } })
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw createError({ statusCode: 400, statusMessage: '2FA is not enabled' })
    }

    const { verify } = await import('otplib')
    const isValid = await verify({ token, secret: user.twoFactorSecret })

    if (isValid) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        })
        return { success: true, message: '2FA disabled successfully' }
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Invalid token' })
    }
})
