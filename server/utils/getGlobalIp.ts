import { prisma } from './prisma'
import { fetchFromTarget } from './fetchFromTarget'

const DEFAULT_PROVIDERS = [
    'https://api.ipify.org?format=json',
    'https://ifconfig.me/ip',
    'https://api.myip.com'
]

const DEFAULT_V6_PROVIDERS = [
    'https://api64.ipify.org?format=json',
    'https://ifconfig.co/ip'
]

export async function getGlobalIp(ipv6 = false): Promise<string | null> {
    let providers = ipv6 ? DEFAULT_V6_PROVIDERS : DEFAULT_PROVIDERS

    // Check if custom providers exists in Settings
    try {
        const settingKey = ipv6 ? 'ip_providers_v6' : 'ip_providers_v4'
        const customProviders = await prisma.settings.findUnique({ where: { key: settingKey } })
        if (customProviders && customProviders.value) {
            const parsed = JSON.parse(customProviders.value)
            if (Array.isArray(parsed) && parsed.length > 0) {
                providers = parsed
            }
        }
    } catch (e) {
        // Fallback to defaults
    }

    for (const provider of providers) {
        const ip = await fetchFromTarget(provider)
        if (ip) return ip
    }

    return null
}
