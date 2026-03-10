import type { H3Event } from 'h3'
import { useSession } from 'h3'

export const getUserSession = (event: H3Event) => {
    const isHttps = process.env.SESSION_SECURE === 'true'

    return useSession(event, {
        password: process.env.SESSION_PASSWORD || 'default_secure_session_password_change_me_in_production',
        name: 'tetherdns_session',
        maxAge: 60 * 60 * 24 * 30,
        cookie: {
            httpOnly: true,
            secure: isHttps,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
        }
    })
}