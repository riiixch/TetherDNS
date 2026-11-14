import { getGlobalIp } from '../../utils/getGlobalIp'

export default defineEventHandler(async () => {
    try {
        const [ipv4, ipv6] = await Promise.all([
            getGlobalIp(false),
            getGlobalIp(true)
        ])
        return {
            success: true,
            data: {
                ipv4: ipv4 || null,
                ipv6: ipv6 || null
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to detect IP'
        })
    }
})
