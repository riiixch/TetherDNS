import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const session = await useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production'
    })

    if (!session.data.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { name, type, target, interval } = body

    if (!name || !type || !target) {
        throw createError({ statusCode: 400, statusMessage: 'name, type, and target are required' })
    }

    const healthCheck = await prisma.healthCheck.create({
        data: {
            name,
            type,
            target,
            interval: interval || 5,
            isEnabled: true
        }
    })

    return { success: true, data: healthCheck }
})
