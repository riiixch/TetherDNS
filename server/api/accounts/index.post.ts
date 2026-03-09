import { prisma } from '../../utils/prisma'
import { encrypt } from '../../utils/encrypt'
import Cloudflare from 'cloudflare'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.label || !body.email || !body.apiToken) {
        throw createError({ statusCode: 400, statusMessage: 'label, email and apiToken are required' })
    }

    try {
        // Test connection first
        const testClient = new Cloudflare({
            apiEmail: body.email,
            apiToken: body.apiToken,
        })
        await testClient.accounts.list()

        // Save with encrypted token
        const account = await prisma.cloudflareAccount.create({
            data: {
                label: body.label,
                email: body.email,
                apiToken: encrypt(body.apiToken),
            },
            select: { id: true, label: true, email: true, createdAt: true }
        })

        return { success: true, data: account, message: 'Account added successfully' }
    } catch (error: any) {
        if (error.statusCode) throw error
        throw createError({
            statusCode: 400,
            statusMessage: error.message?.includes('Authentication')
                ? 'Invalid Cloudflare credentials. Please check your email and API token.'
                : error.message || 'Failed to add account'
        })
    }
})
