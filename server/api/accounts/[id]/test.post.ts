import { prisma } from '../../../utils/prisma'
import { createCloudflareClient } from '../../../utils/cloudflare'
import { decrypt } from '../../../utils/crypto'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

    try {
        const account = await prisma.cloudflareAccount.findUnique({ where: { id: parseInt(id) } })
        if (!account) throw createError({ statusCode: 404, statusMessage: 'Account not found' })

        const cf = await createCloudflareClient(account.id)
        // Test by listing zones
        await cf.zones.list({ per_page: 1 })

        return { success: true, message: `Connection to "${account.label}" is working!` }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: `Connection failed: ${error.message}` })
    }
})
