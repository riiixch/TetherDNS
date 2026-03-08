import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const accountId = Number(getRouterParam(event, 'id'))

    if (!accountId) {
        throw createError({ statusCode: 400, statusMessage: 'Account ID is required' })
    }

    try {
        // Check if account has zones
        const zonesCount = await prisma.zone.count({ where: { accountId } })
        if (zonesCount > 0) {
            throw createError({
                statusCode: 400,
                statusMessage: `Cannot delete account. It still has ${zonesCount} zone(s) linked. Delete zones first.`
            })
        }

        await prisma.cloudflareAccount.delete({ where: { id: accountId } })

        return { success: true, message: 'Account deleted successfully' }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || error.message || 'Failed to delete account'
        })
    }
})
