import net from 'net'
import { Agent } from 'undici'

export interface ProbeResult {
    success: boolean
    latencyMs: number
    statusCode?: number
    errorMessage?: string
}

// Reusable dispatcher allowing self-signed internal certs (homelab/internal services)
const insecureAgent = new Agent({
    connect: {
        rejectUnauthorized: false
    }
})

export class ProbeService {
    /**
     * Probe an HTTP/HTTPS endpoint with timeout and status code verification
     */
    static async probeHttp(url: string, expectedStatus = 200, timeoutMs = 5000): Promise<ProbeResult> {
        const start = performance.now()
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const fetchOptions: any = {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'TetherDNS-HealthCheck/1.0'
                },
                dispatcher: insecureAgent
            }

            const res = await fetch(url, fetchOptions)
            clearTimeout(timer)
            const latencyMs = Math.round(performance.now() - start)

            // Status check (matches exact or 2xx range if 200)
            const isMatch = expectedStatus === 200
                ? (res.status >= 200 && res.status < 300)
                : res.status === expectedStatus

            if (isMatch) {
                return { success: true, latencyMs, statusCode: res.status }
            } else {
                return {
                    success: false,
                    latencyMs,
                    statusCode: res.status,
                    errorMessage: `HTTP status mismatch (expected ${expectedStatus}, got ${res.status})`
                }
            }
        } catch (err: any) {
            clearTimeout(timer)
            const latencyMs = Math.round(performance.now() - start)
            const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout')
            return {
                success: false,
                latencyMs,
                errorMessage: isTimeout ? `Request timed out (> ${timeoutMs}ms)` : (err.message || 'Network connection failed')
            }
        }
    }

    /**
     * Probe a TCP host:port with timeout (supports IPv4, IPv6, and domain names)
     */
    static async probeTcp(target: string, timeoutMs = 5000): Promise<ProbeResult> {
        const start = performance.now()
        let host: string
        let port = 80

        const trimmed = target.trim()
        if (trimmed.startsWith('[')) {
            // IPv6 format: [2001:db8::1]:8080 or [2001:db8::1]
            const closeBracket = trimmed.indexOf(']')
            if (closeBracket === -1) {
                return { success: false, latencyMs: 0, errorMessage: `Malformed IPv6 address: "${target}"` }
            }
            host = trimmed.slice(1, closeBracket)
            const rest = trimmed.slice(closeBracket + 1)
            if (rest.startsWith(':')) {
                const parsedPort = parseInt(rest.slice(1), 10)
                if (!isNaN(parsedPort)) port = parsedPort
            }
        } else {
            // IPv4 or domain name
            const lastColon = trimmed.lastIndexOf(':')
            if (lastColon !== -1) {
                host = trimmed.slice(0, lastColon)
                const parsedPort = parseInt(trimmed.slice(lastColon + 1), 10)
                if (!isNaN(parsedPort)) port = parsedPort
            } else {
                host = trimmed
            }
        }

        if (!host) {
            return {
                success: false,
                latencyMs: 0,
                errorMessage: `Invalid TCP target format "${target}" (expected host:port)`
            }
        }

        return new Promise<ProbeResult>((resolve) => {
            const socket = new net.Socket()
            let resolved = false

            const finish = (result: ProbeResult) => {
                if (resolved) return
                resolved = true
                socket.destroy()
                resolve(result)
            }

            socket.setTimeout(timeoutMs)

            socket.on('connect', () => {
                const latencyMs = Math.round(performance.now() - start)
                finish({ success: true, latencyMs })
            })

            socket.on('timeout', () => {
                const latencyMs = Math.round(performance.now() - start)
                finish({ success: false, latencyMs, errorMessage: `TCP connect timed out (> ${timeoutMs}ms)` })
            })

            socket.on('error', (err) => {
                const latencyMs = Math.round(performance.now() - start)
                finish({ success: false, latencyMs, errorMessage: err.message || 'TCP connection refused' })
            })

            try {
                socket.connect(port, host)
            } catch (err: any) {
                finish({ success: false, latencyMs: 0, errorMessage: err.message })
            }
        })
    }

    /**
     * Execute probe based on HealthCheck config
     */
    static async executeProbe(check: {
        probeType: string
        probeTarget: string
        expectedStatus?: number | null
        timeoutSeconds: number
    }): Promise<ProbeResult> {
        const timeoutMs = (check.timeoutSeconds || 5) * 1000

        if (check.probeType === 'TCP') {
            return await this.probeTcp(check.probeTarget, timeoutMs)
        } else {
            // Default HTTP or HTTPS
            let targetUrl = check.probeTarget.trim()
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = check.probeType === 'HTTPS' ? `https://${targetUrl}` : `http://${targetUrl}`
            }
            return await this.probeHttp(targetUrl, check.expectedStatus || 200, timeoutMs)
        }
    }
}
