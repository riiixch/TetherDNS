import { scryptSync } from 'node:crypto'

export function getKey(): Buffer {
    const secret = process.env.SESSION_PASSWORD || 'default-secret-key-change-me'
    return scryptSync(secret, 'salt', 32)
}
