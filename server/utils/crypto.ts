import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey(): Buffer {
    const secret = process.env.SESSION_PASSWORD || 'default-secret-key-change-me'
    return scryptSync(secret, 'salt', 32)
}

export function encrypt(text: string): string {
    const key = getKey()
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText: string): string {
    const key = getKey()
    const parts = encryptedText.split(':')
    const ivHex = parts[0]!
    const encrypted = parts[1]!
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}
