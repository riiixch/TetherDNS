import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'User ID is required' })

    // Prevent deleting oneself
    if (event.context.userId === parseInt(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
    }

    try {
        // Find if user exists
        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
        if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

        // Check if this is the last user
        const userCount = await prisma.user.count()
        if (userCount <= 1) {
            throw createError({ statusCode: 400, statusMessage: 'Cannot delete the last system user' })
        }

        await prisma.user.delete({ where: { id: user.id } })

        return { success: true, message: 'User deleted successfully' }
    } catch (e: any) {
        throw createError({ statusCode: e.statusCode || 500, statusMessage: e.statusMessage || e.message })
    }
})
