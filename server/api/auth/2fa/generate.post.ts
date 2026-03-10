import { prisma } from '../../../utils/prisma'
import { getUserSession } from '../../../utils/session'
import qrcode from 'qrcode'

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)


    if (!session.data.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({ where: { id: session.data.userId } })
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const { generateSecret, generateURI } = await import('otplib')
    const secret = generateSecret()

    // Update user with secret
    await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret }
    })

    const otpauth = generateURI({
        secret,
        label: user.username,
        issuer: 'TetherDNS'
    })

    const qrCodeDataUrl = await qrcode.toDataURL(otpauth)

    return {
        success: true,
        secret,
        qrCodeUrl: qrCodeDataUrl
    }
})
