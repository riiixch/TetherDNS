import { prisma } from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.username || !body.password) {
        throw createError({ statusCode: 400, statusMessage: 'Username and password are required' })
    }

    try {
        // Check if system is already setup
        const userCount = await prisma.user.count()
        if (userCount > 0) {
            throw createError({ statusCode: 403, statusMessage: 'Setup is already complete' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(body.password, salt)

        // Create the first user
        const user = await prisma.user.create({
            data: {
                username: body.username,
                password: hashedPassword
            }
        })

        // Auto-login the user after setup by setting session
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
            data: { id: user.id, username: user.username },
            message: 'Initial setup completed successfully.'
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message
        })
    }
})
