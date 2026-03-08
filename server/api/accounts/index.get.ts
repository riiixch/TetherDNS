import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
    const accounts = await prisma.cloudflareAccount.findMany({
        select: {
            id: true,
            label: true,
            email: true,
            createdAt: true,
            _count: { select: { zones: true } }
        }
    })

    return { success: true, data: accounts }
})
