import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body || typeof body !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'Request body must be an object of key-value pairs' })
    }

    try {
        const entries = Object.entries(body) as [string, string][]

        for (const [key, value] of entries) {
            await prisma.settings.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            })
        }

        return { success: true, message: 'Settings updated successfully' }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
