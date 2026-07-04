import { spawn, ChildProcess, execSync } from 'child_process'
import { prisma } from '../utils/prisma'

class TunnelService {
    private activeProcesses: Map<string, ChildProcess> = new Map()
    private reconnectAttempts: Map<string, number> = new Map()
    private maxReconnects = 5

    isBinaryAvailable(): boolean {
        try {
            const cmd = process.platform === 'win32' ? 'where cloudflared' : 'which cloudflared'
            execSync(cmd, { stdio: 'ignore' })
            return true
        } catch {
            return false
        }
    }

    async initializeTunnels() {
        console.log('[TunnelService] Initializing active tunnels from database...')
        try {
            const tunnels = await prisma.cloudflareTunnel.findMany({
                where: { status: 'active' }
            })
            for (const tunnel of tunnels) {
                console.log(`[TunnelService] Auto-starting tunnel: ${tunnel.name} (${tunnel.tunnelId})`)
                this.startTunnel(tunnel.tunnelId, tunnel.token)
            }
        } catch (error) {
            console.error('[TunnelService] Error initializing tunnels:', error)
        }
    }

    startTunnel(tunnelId: string, token: string) {
        if (this.activeProcesses.has(tunnelId)) {
            console.log(`[TunnelService] Tunnel ${tunnelId} is already running.`)
            return
        }

        console.log(`[TunnelService] Starting cloudflared for tunnel ${tunnelId}...`)

        // Spawn cloudflared daemon
        const cp = spawn('cloudflared', ['tunnel', '--no-autoupdate', 'run', '--token', token], {
            stdio: 'pipe'
        })

        this.activeProcesses.set(tunnelId, cp)

        cp.on('error', async (err: any) => {
            console.error(`[TunnelService] Failed to start cloudflared process for tunnel ${tunnelId}:`, err.message)
            this.activeProcesses.delete(tunnelId)
            try {
                await prisma.cloudflareTunnel.update({
                    where: { tunnelId },
                    data: { status: 'inactive', connections: JSON.stringify({ lastMessage: `Error: cloudflared binary not found or failed to spawn (${err.message})`, time: new Date() }) }
                })
            } catch (e) {
                // Ignore DB errors
            }
        })

        cp.stdout?.on('data', (data) => {
            console.log(`[cloudflared stdout ${tunnelId}]:`, data.toString().trim())
        })

        cp.stderr?.on('data', async (data) => {
            const msg = data.toString().trim()
            console.error(`[cloudflared stderr ${tunnelId}]:`, msg)
            
            // Look for connection established messages to update status/logs
            if (msg.includes('Connection') && msg.includes('established')) {
                try {
                    await prisma.cloudflareTunnel.update({
                        where: { tunnelId },
                        data: { status: 'active', connections: JSON.stringify({ lastMessage: msg, time: new Date() }) }
                    })
                } catch (e) {
                    // Ignore DB errors on rapid updates
                }
            }
        })

        cp.on('close', async (code) => {
            console.log(`[TunnelService] cloudflared process for tunnel ${tunnelId} closed with code ${code}`)
            this.activeProcesses.delete(tunnelId)

            // Auto-reconnect if it closed unexpectedly and status in DB is active
            try {
                const tunnel = await prisma.cloudflareTunnel.findUnique({ where: { tunnelId } })
                if (tunnel && tunnel.status === 'active') {
                    const attempts = this.reconnectAttempts.get(tunnelId) || 0
                    if (attempts < this.maxReconnects) {
                        this.reconnectAttempts.set(tunnelId, attempts + 1)
                        const delay = Math.pow(2, attempts) * 1000
                        console.log(`[TunnelService] Attempting reconnect for ${tunnelId} in ${delay}ms...`)
                        setTimeout(() => {
                            this.startTunnel(tunnelId, token)
                        }, delay)
                    } else {
                        console.error(`[TunnelService] Max reconnect attempts reached for tunnel ${tunnelId}`)
                        await prisma.cloudflareTunnel.update({
                            where: { tunnelId },
                            data: { status: 'inactive' }
                        })
                    }
                } else {
                    await prisma.cloudflareTunnel.update({
                        where: { tunnelId },
                        data: { status: 'inactive' }
                    })
                }
            } catch (error) {
                console.error('[TunnelService] Error handling tunnel close:', error)
            }
        })
    }

    async stopTunnel(tunnelId: string) {
        console.log(`[TunnelService] Stopping tunnel ${tunnelId}...`)
        
        // Reset reconnect attempts
        this.reconnectAttempts.delete(tunnelId)

        // Set status in DB to inactive first so the close handler doesn't auto-reconnect
        try {
            await prisma.cloudflareTunnel.update({
                where: { tunnelId },
                data: { status: 'inactive' }
            })
        } catch (error) {
            console.error('[TunnelService] Error updating tunnel status on stop:', error)
        }

        const cp = this.activeProcesses.get(tunnelId)
        if (cp) {
            cp.kill()
            this.activeProcesses.delete(tunnelId)
        }
    }

    isTunnelRunning(tunnelId: string): boolean {
        return this.activeProcesses.has(tunnelId)
    }

    shutdown() {
        console.log('[TunnelService] Shutting down all active tunnels...')
        for (const [tunnelId, cp] of this.activeProcesses.entries()) {
            cp.kill()
        }
        this.activeProcesses.clear()
    }
}

export const tunnelService = new TunnelService()
