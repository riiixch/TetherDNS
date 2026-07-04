import { prisma } from '../../utils/prisma'
import { tunnelService } from '../../services/TunnelService'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const accountId = query.accountId ? Number(query.accountId) : undefined

    if (!accountId) {
        throw createError({ statusCode: 400, statusMessage: 'accountId is required' })
    }

    try {
        const tunnels = await prisma.cloudflareTunnel.findMany({
            where: { accountId },
            orderBy: { createdAt: 'desc' }
        })

        // Check running states and ensure database matches memory state
        const updatedTunnels = tunnels.map(t => {
            const isRunning = tunnelService.isTunnelRunning(t.tunnelId)
            const expectedStatus = isRunning ? 'active' : 'inactive'
            return {
                ...t,
                status: isRunning ? t.status : 'inactive' // If not running in process, status is inactive
            }
        })

        return { success: true, data: updatedTunnels }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
