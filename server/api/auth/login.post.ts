import { prisma } from '../../utils/prisma'
import { getUserSession } from '../../utils/session'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.username || !body.password) {
        throw createError({ statusCode: 400, statusMessage: 'Username and password are required' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username: body.username }
        })

        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
        }

        const isMatch = await bcrypt.compare(body.password, user.password)

        if (!isMatch) {
            throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            if (!body.totpCode) {
                // Return a specific response indicating 2FA is required
                return {
                    success: false,
                    requires2FA: true,
                    message: '2FA code required'
                }
            } else {
                const { verify } = await import('otplib')
                const isValid = await verify({ token: body.totpCode, secret: user.twoFactorSecret! })
                if (!isValid) {
                    throw createError({ statusCode: 401, statusMessage: 'Invalid 2FA code' })
                }
            }
        }

        // Set Nuxt Session Cookie
        const session = await getUserSession(event)


        await session.update({
            userId: user.id,
            username: user.username,
            createdAt: new Date()
        })

        return {
            success: true,
            message: 'Logged in successfully'
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message
        })
    }
})
