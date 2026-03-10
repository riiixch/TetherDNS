import { prisma } from '../../../utils/prisma'
import { getUserSession } from '../../../utils/session'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (!session.data.userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const body = await readBody(event)
    if (!body.name) throw createError({ statusCode: 400, statusMessage: 'Token name required' })

    const rawToken = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    const token = await prisma.apiToken.create({
        data: {
            name: body.name,
            tokenHash,
            userId: session.data.userId
        }
    })

    return {
        id: token.id,
        name: token.name,
        rawToken // Only shown once
    }
})
