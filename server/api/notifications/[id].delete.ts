import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

    try {
        await prisma.notificationChannel.delete({ where: { id: parseInt(id) } })
        return { success: true, message: 'Notification channel deleted' }
    } catch (error: any) {
        throw createError({ statusCode: error.code === 'P2025' ? 404 : 500, statusMessage: error.message })
    }
})
