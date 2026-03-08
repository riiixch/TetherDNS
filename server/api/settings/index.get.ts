import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
    try {
        const settings = await prisma.settings.findMany()
        const result: Record<string, string> = {}
        for (const s of settings) {
            result[s.key] = s.value
        }
        return { success: true, data: result }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
