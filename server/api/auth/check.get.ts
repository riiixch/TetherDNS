import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
    try {
        const userCount = await prisma.user.count()
        return {
            success: true,
            isSetupRequired: userCount === 0
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
