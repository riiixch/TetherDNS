import Cloudflare from 'cloudflare'
import { prisma } from './prisma'
import { decrypt } from './decrypt'

export async function createCloudflareClient(accountId: number): Promise<Cloudflare> {
    const account = await prisma.cloudflareAccount.findUnique({ where: { id: accountId } })

    if (!account) {
        throw new Error(`Cloudflare Account with ID ${accountId} not found.`)
    }

    return new Cloudflare({
        apiEmail: account.email,
        apiToken: decrypt(account.apiToken),
    })
}