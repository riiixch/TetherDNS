import { prisma } from '../../utils/prisma'
import { callCloudflareApi, getCloudflareAccountId } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { accountId, name } = body

    if (!accountId || !name) {
        throw createError({ statusCode: 400, statusMessage: 'accountId and name are required' })
    }

    try {
        const account = await prisma.cloudflareAccount.findUnique({ where: { id: Number(accountId) } })
        if (!account) {
            throw createError({ statusCode: 404, statusMessage: 'Cloudflare Account not found' })
        }

        // Get Cloudflare Account Hex ID
        const cfAccountId = await getCloudflareAccountId(account)

        // Create tunnel on Cloudflare
        const cfTunnelRes = await callCloudflareApi(account, `/accounts/${cfAccountId}/cfd_tunnel`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                config_src: 'cloudflare'
            })
        })

        const tunnelData = cfTunnelRes.result
        if (!tunnelData || !tunnelData.id || !tunnelData.token) {
            throw new Error('Cloudflare API did not return tunnel ID or Token.')
        }

        // Save Tunnel in Database
        const localTunnel = await prisma.cloudflareTunnel.create({
            data: {
                tunnelId: tunnelData.id,
                name: tunnelData.name,
                token: tunnelData.token,
                status: 'inactive',
                accountId: account.id
            }
        })

        return { success: true, data: localTunnel }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
