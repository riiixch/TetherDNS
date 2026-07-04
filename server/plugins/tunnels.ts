import { tunnelService } from '../services/TunnelService'

export default defineNitroPlugin((nitroApp) => {
    // Initialize active tunnels from database on startup
    tunnelService.initializeTunnels()

    // Graceful shutdown
    nitroApp.hooks.hook('close', () => {
        console.log('[Tunnels Plugin] Graceful shutdown of tunnels...')
        tunnelService.shutdown()
    })
})
