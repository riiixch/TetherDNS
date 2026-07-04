import { prisma } from '../../utils/prisma'
import { tunnelService } from '../../services/TunnelService'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { tunnelId, action } = body

    if (!tunnelId || !action) {
        throw createError({ statusCode: 400, statusMessage: 'tunnelId and action are required' })
    }

    try {
        const tunnel = await prisma.cloudflareTunnel.findUnique({
            where: { tunnelId }
        })

        if (!tunnel) {
            throw createError({ statusCode: 404, statusMessage: 'Tunnel not found' })
        }

        if (action === 'start') {
            if (!tunnelService.isBinaryAvailable()) {
                throw createError({
                    statusCode: 400,
                    message: 'โปรแกรม cloudflared ไม่ถูกติดตั้งในระบบ หรือไม่ได้ตั้งค่าใน PATH กรุณาติดตั้งให้เสร็จสิ้นก่อนเปิดใช้งาน Daemon'
                })
            }
            // Set DB status to active so the service knows it is meant to run
            await prisma.cloudflareTunnel.update({
                where: { tunnelId },
                data: { status: 'active' }
            })
            tunnelService.startTunnel(tunnel.tunnelId, tunnel.token)
        } else if (action === 'stop') {
            await tunnelService.stopTunnel(tunnel.tunnelId)
        } else {
            throw createError({ statusCode: 400, message: 'Invalid action. Must be "start" or "stop".' })
        }

        return { success: true, isRunning: tunnelService.isTunnelRunning(tunnelId) }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || error.statusMessage
        })
    }
})
