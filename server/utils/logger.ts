export const logger = {
    info: (...args: any[]) => console.log('[TetherDNS]', ...args),
    warn: (...args: any[]) => console.warn('[TetherDNS WARN]', ...args),
    error: (...args: any[]) => console.error('[TetherDNS ERROR]', ...args),
}
