export default defineNuxtPlugin((nuxtApp) => {
    const router = useRouter()
    const { startLoading, stopLoading } = useAppLoading()

    const getRouteInfo = (path: string) => {
        if (path === '/') {
            return { message: 'Loading Dashboard...', subtitle: 'Monitor Edge & Activities' }
        } else if (path.startsWith('/zones/')) {
            return { message: 'Loading DNS Records...', subtitle: 'Zone Records & Edge Routing' }
        } else if (path.startsWith('/zones')) {
            return { message: 'Loading DNS Zones...', subtitle: 'Cloudflare Managed Zones' }
        } else if (path.startsWith('/accounts')) {
            return { message: 'Loading Accounts...', subtitle: 'Cloudflare API Integrations' }
        } else if (path.startsWith('/tunnels')) {
            return { message: 'Loading Cloudflare Tunnels...', subtitle: 'Zero Trust Network Tunnels' }
        } else if (path.startsWith('/logs')) {
            return { message: 'Loading Update Logs...', subtitle: 'DDNS Automation Trails' }
        } else if (path.startsWith('/audit')) {
            return { message: 'Loading Audit Trails...', subtitle: 'Security & Audit Logs' }
        } else if (path.startsWith('/settings')) {
            return { message: 'Loading System Settings...', subtitle: 'Engine & Preferences' }
        } else if (path.startsWith('/login')) {
            return { message: 'Securing Gateway...', subtitle: 'Authentication Gate' }
        } else if (path.startsWith('/setup')) {
            return { message: 'Initializing System...', subtitle: 'First-Time Setup' }
        }
        return { message: 'Loading Application...', subtitle: 'Cloudflare Edge Manager' }
    }

    // Trigger full-page loading screen on page transitions
    router.beforeEach((to, from) => {
        if (to.path !== from.path) {
            const { message, subtitle } = getRouteInfo(to.path)
            startLoading(message, subtitle)
        }
    })

    // Settle and dismiss after page mount
    router.afterEach(() => {
        stopLoading(400)
    })
})
