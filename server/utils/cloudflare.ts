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

export async function callCloudflareApi(account: any, path: string, options: any = {}) {
    const token = decrypt(account.apiToken)
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    })
    const data: any = await response.json()
    if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || response.statusText)
    }
    return data
}

export async function getCloudflareAccountId(account: any): Promise<string> {
    // 1. Try to get accounts list
    try {
        const data = await callCloudflareApi(account, '/accounts')
        if (data.result?.[0]?.id) {
            return data.result[0].id
        }
    } catch (e) {
        // Fallback to zones list if accounts list fails (due to permissions)
    }

    // 2. Fallback: get from first zone
    const data = await callCloudflareApi(account, '/zones')
    if (data.result?.[0]?.account?.id) {
        return data.result[0].account.id
    }

    throw new Error('Could not retrieve Cloudflare Account ID. Please ensure your API Token has appropriate Zone/Account read permissions.')
}

export async function syncTunnelConfiguration(accountId: number, tunnelId: string) {
    const account = await prisma.cloudflareAccount.findUnique({
        where: { id: accountId }
    })
    if (!account) return

    const cfAccountId = await getCloudflareAccountId(account)

    // Fetch all DNS records currently mapped to this tunnel
    const tunnelRecords = await prisma.dnsRecord.findMany({
        where: {
            tunnelId,
            routingMode: 'tunnel'
        }
    })

    // Construct ingress rules
    const ingress = tunnelRecords.map(r => ({
        hostname: r.name,
        service: r.localAddress || 'http://localhost:80'
    }))

    // Add fallback rule
    ingress.push({
        service: 'http_status:404'
    } as any)

    // Update configuration on Cloudflare
    await callCloudflareApi(account, `/accounts/${cfAccountId}/cfd_tunnel/${tunnelId}/configurations`, {
        method: 'PUT',
        body: JSON.stringify({
            config: { ingress }
        })
    })
}