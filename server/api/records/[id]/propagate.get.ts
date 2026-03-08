import { prisma } from '../../../utils/prisma'
import { resolve4, resolve6, setServers } from 'dns/promises'

const RESOLVERS = [
    { name: 'Google', ip: '8.8.8.8' },
    { name: 'Cloudflare', ip: '1.1.1.1' },
    { name: 'OpenDNS', ip: '208.67.222.222' },
    { name: 'Quad9', ip: '9.9.9.9' }
]

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })

    try {
        const record = await prisma.dnsRecord.findUnique({ where: { id: parseInt(id) } })
        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })

        if (record.type !== 'A' && record.type !== 'AAAA') {
            throw createError({ statusCode: 400, statusMessage: 'Propagation check is only supported for A and AAAA records' })
        }

        const results = await Promise.all(
            RESOLVERS.map(async (resolver) => {
                try {
                    setServers([resolver.ip])
                    const addresses = record.type === 'A'
                        ? await resolve4(record.name)
                        : await resolve6(record.name)

                    let isPropagated = false
                    if (record.proxied) {
                        // If proxied, Cloudflare masks the IP. We consider it propagated if
                        // the origin IP is NOT exposed, and it resolves to at least one IP.
                        isPropagated = addresses.length > 0 && !addresses.includes(record.content)
                    } else {
                        isPropagated = addresses.includes(record.content)
                    }

                    return {
                        resolver: resolver.name,
                        ip: resolver.ip,
                        resolved: addresses,
                        propagated: isPropagated
                    }
                } catch (e: any) {
                    return {
                        resolver: resolver.name,
                        ip: resolver.ip,
                        resolved: [],
                        propagated: false,
                        error: e.code || e.message
                    }
                }
            })
        )

        return {
            success: true,
            record: record.name,
            expected: record.proxied ? 'Cloudflare IPs (Proxied)' : record.content,
            results,
            fullyPropagated: results.every(r => r.propagated)
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
