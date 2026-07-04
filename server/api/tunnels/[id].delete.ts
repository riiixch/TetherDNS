import { prisma } from '../../utils/prisma'
import { callCloudflareApi, getCloudflareAccountId } from '../../utils/cloudflare'
import { tunnelService } from '../../services/TunnelService'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Tunnel ID is required' })
    }

    try {
        const tunnel = await prisma.cloudflareTunnel.findUnique({
            where: { tunnelId: id },
            include: { account: true }
        })

        if (!tunnel) {
            throw createError({ statusCode: 404, statusMessage: 'Tunnel not found' })
        }

        // 1. Stop local process if active
        await tunnelService.stopTunnel(tunnel.tunnelId)

        // 2. Delete on Cloudflare
        const cfAccountId = await getCloudflareAccountId(tunnel.account)
        try {
            await callCloudflareApi(tunnel.account, `/accounts/${cfAccountId}/cfd_tunnel/${tunnel.tunnelId}`, {
                method: 'DELETE'
            })
        } catch (e: any) {
            console.warn(`[Tunnel Delete] Failed to delete tunnel ${tunnel.tunnelId} on Cloudflare:`, e.message)
            // Continue deleting locally in case it was already deleted on Cloudflare
        }

        // 3. Delete from Local DB
        await prisma.cloudflareTunnel.delete({
            where: { tunnelId: id }
        })

        return { success: true, message: 'Tunnel deleted successfully' }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
