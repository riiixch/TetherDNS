import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                createdAt: true,
            }
        })
        return { success: true, data: users }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
