import { prisma } from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.username || !body.password) {
        throw createError({ statusCode: 400, statusMessage: 'Username and password are required' })
    }

    try {
        const existingInfo = await prisma.user.findUnique({ where: { username: body.username } })
        if (existingInfo) {
            throw createError({ statusCode: 400, statusMessage: 'Username already exists' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(body.password, salt)

        const user = await prisma.user.create({
            data: {
                username: body.username,
                password: hashedPassword
            },
            select: { id: true, username: true, createdAt: true }
        })

        return { success: true, message: 'User created successfully', data: user }
    } catch (e: any) {
        throw createError({ statusCode: e.statusCode || 500, statusMessage: e.statusMessage || e.message })
    }
})
