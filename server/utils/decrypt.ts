import { createDecipheriv } from 'node:crypto'
import { getKey } from './getKey'

const ALGORITHM = 'aes-256-cbc'

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
