import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
    const channels = await prisma.notificationChannel.findMany({
        select: { id: true, type: true, label: true, enabled: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: channels }
})
