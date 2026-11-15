import { prisma } from '../../../utils/prisma'
import { Resolver } from 'dns/promises'

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
                    const rInstance = new Resolver()
                    rInstance.setServers([resolver.ip])
                    const addresses = record.type === 'A'
                        ? await rInstance.resolve4(record.name)
                        : await rInstance.resolve6(record.name)

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

        const isAllPropagated = results.every(r => r.propagated)
        const formattedResolvers = results.map(r => ({
            ...r,
            name: r.resolver,
            matched: r.propagated,
            ipDisplay: r.resolved.length > 0 ? r.resolved.join(', ') : 'NXDOMAIN'
        }))

        return {
            success: true,
            record: record.name,
            expected: record.proxied ? 'Cloudflare IPs (Proxied)' : record.content,
            results: formattedResolvers,
            resolvers: formattedResolvers,
            fullyPropagated: isAllPropagated,
            summary: isAllPropagated ? 'Fully Propagated' : 'Propagating...'
        }
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || error.message })
    }
})
