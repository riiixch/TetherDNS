import { createCipheriv, randomBytes } from 'node:crypto'
import { getKey } from './getKey'

const ALGORITHM = 'aes-256-cbc'

export function encrypt(text: string): string {
    const key = getKey()
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
}
