import { prisma } from '../../utils/prisma'
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

        // Set Nuxt Session Cookie
        const session = await useSession(event, {
            password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

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
