import { callCloudflareApi } from '../utils/cloudflare'
import { prisma } from '../utils/prisma'
import { sendNotifications } from '../utils/sendNotifications'
import type {
    SecurityLevel,
    AccessRuleMode,
    AccessRuleTarget,
    ZoneSecuritySettings,
    IpAccessRule,
    WafCustomRule
} from '~~/types/security'

export class CloudflareSecurityService {
    /**
     * Check if an error message represents a permission or authorization issue
     */
    static isPermissionError(msg?: string): boolean {
        if (!msg) return false
        const lower = msg.toLowerCase()
        return lower.includes('permission') ||
               lower.includes('authz') ||
               lower.includes('authentication error') ||
               lower.includes('not authorized') ||
               lower.includes('code 10000') ||
               lower.includes('actor')
    }

    /**
     * Retrieve security settings for a zone
     */
    static async getSecuritySettings(account: any, cfZoneId: string): Promise<ZoneSecuritySettings> {
        const [secLevelSettled, challengeTtlSettled, browserCheckSettled] = await Promise.allSettled([
            callCloudflareApi(account, `/zones/${cfZoneId}/settings/security_level`),
            callCloudflareApi(account, `/zones/${cfZoneId}/settings/challenge_ttl`),
            callCloudflareApi(account, `/zones/${cfZoneId}/settings/browser_check`)
        ])

        if (secLevelSettled.status === 'rejected') {
            throw secLevelSettled.reason
        }

        const secLevelRes = secLevelSettled.value
        const challengeTtlRes = challengeTtlSettled.status === 'fulfilled' ? challengeTtlSettled.value : null
        const browserCheckRes = browserCheckSettled.status === 'fulfilled' ? browserCheckSettled.value : null

        const securityLevel = (secLevelRes.result?.value || 'medium') as SecurityLevel
        const challengeTtl = (challengeTtlRes?.result?.value ?? 1800) as number
        const browserCheck = (browserCheckRes?.result?.value || 'on') as 'on' | 'off'

        return {
            zoneId: cfZoneId,
            securityLevel,
            challengeTtl,
            browserCheck,
            modifiedOn: secLevelRes.result?.modified_on || null,
            isUnderAttack: securityLevel === 'under_attack'
        }
    }

    /**
     * Update security level (including Emergency Under Attack Mode)
     */
    static async updateSecurityLevel(
        account: any,
        zone: any,
        level: SecurityLevel,
        user: any,
        clientIp?: string
    ): Promise<ZoneSecuritySettings> {
        const res = await callCloudflareApi(account, `/zones/${zone.cfZoneId}/settings/security_level`, {
            method: 'PATCH',
            body: JSON.stringify({ value: level })
        })

        // Audit log
        if (user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SECURITY_LEVEL_CHANGE',
                    target: zone.name,
                    details: `Changed security level to "${level}" (IP: ${clientIp || 'unknown'})`
                }
            }).catch(e => console.warn('[AuditLog] Failed to record security level change:', e.message))
        }

        // Send alert if Under Attack is activated
        if (level === 'under_attack') {
            sendNotifications({
                title: '🚨 SECURITY ALERT: Under Attack Mode Activated',
                message: `Emergency DDoS Defense (Under Attack Mode) has been **ACTIVATED** for **${zone.name}**!`,
                color: 'error',
                eventType: 'SECURITY',
                fields: [
                    { name: 'Zone', value: zone.name, inline: true },
                    { name: 'Activated By', value: user?.username || 'System', inline: true },
                    { name: 'Client IP', value: clientIp || 'unknown', inline: true }
                ]
            }).catch(e => console.warn('[Security Notification] Failed:', e.message))
        }

        return this.getSecuritySettings(account, zone.cfZoneId)
    }

    /**
     * Update general settings (Challenge TTL and Browser Integrity Check)
     */
    static async updateGeneralSettings(
        account: any,
        zone: any,
        settings: { challengeTtl?: number; browserCheck?: 'on' | 'off' },
        user: any
    ): Promise<ZoneSecuritySettings> {
        const promises = []

        if (settings.challengeTtl !== undefined) {
            promises.push(
                callCloudflareApi(account, `/zones/${zone.cfZoneId}/settings/challenge_ttl`, {
                    method: 'PATCH',
                    body: JSON.stringify({ value: settings.challengeTtl })
                })
            )
        }

        if (settings.browserCheck !== undefined) {
            promises.push(
                callCloudflareApi(account, `/zones/${zone.cfZoneId}/settings/browser_check`, {
                    method: 'PATCH',
                    body: JSON.stringify({ value: settings.browserCheck })
                })
            )
        }

        await Promise.all(promises)

        // Audit log
        if (user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SECURITY_SETTINGS_CHANGE',
                    target: zone.name,
                    details: `Updated settings: ${JSON.stringify(settings)}`
                }
            }).catch(e => console.warn('[AuditLog] Failed to record:', e.message))
        }

        return this.getSecuritySettings(account, zone.cfZoneId)
    }

    /**
     * List IP Access Rules (Firewall Rules)
     */
    static async listAccessRules(
        account: any,
        cfZoneId: string,
        page = 1,
        perPage = 50
    ): Promise<{ rules: IpAccessRule[]; total: number }> {
        const res = await callCloudflareApi(
            account,
            `/zones/${cfZoneId}/firewall/access_rules/rules?page=${page}&per_page=${perPage}&order=status&direction=desc`
        )

        const rawList = res.result || []
        const total = res.result_info?.total_count || rawList.length

        const rules: IpAccessRule[] = rawList.map((r: any) => ({
            id: r.id,
            mode: r.mode,
            target: r.configuration?.target,
            value: r.configuration?.value,
            notes: r.notes || '',
            createdOn: r.created_on,
            modifiedOn: r.modified_on || null,
            allowedModes: r.allowed_modes || []
        }))

        return { rules, total }
    }

    /**
     * Create IP or Country Access Rule (Block, Challenge, Whitelist)
     */
    static async createAccessRule(
        account: any,
        zone: any,
        payload: {
            mode: AccessRuleMode
            target: AccessRuleTarget
            value: string
            notes?: string
        },
        user: any
    ): Promise<IpAccessRule> {
        let normalizedValue = payload.value.trim()
        if (payload.target === 'country') {
            normalizedValue = normalizedValue.toUpperCase()
        } else if (payload.target === 'asn') {
            normalizedValue = normalizedValue.toUpperCase()
            if (!normalizedValue.startsWith('AS')) {
                normalizedValue = `AS${normalizedValue}`
            }
        }

        const res = await callCloudflareApi(
            account,
            `/zones/${zone.cfZoneId}/firewall/access_rules/rules`,
            {
                method: 'POST',
                body: JSON.stringify({
                    mode: payload.mode,
                    configuration: {
                        target: payload.target,
                        value: normalizedValue
                    },
                    notes: payload.notes || 'Created via TetherDNS Security Hub'
                })
            }
        )

        const r = res.result
        const rule: IpAccessRule = {
            id: r.id,
            mode: r.mode,
            target: r.configuration?.target,
            value: r.configuration?.value,
            notes: r.notes || '',
            createdOn: r.created_on,
            modifiedOn: r.modified_on || null,
            allowedModes: r.allowed_modes || []
        }

        // Audit log
        if (user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SECURITY_IP_RULE_ADD',
                    target: zone.name,
                    details: `${payload.mode.toUpperCase()} rule added for ${payload.target}: "${payload.value}"`
                }
            }).catch(e => console.warn('[AuditLog] Failed to record:', e.message))
        }

        return rule
    }

    /**
     * Delete an IP or Country Access Rule
     */
    static async deleteAccessRule(
        account: any,
        zone: any,
        ruleId: string,
        user: any
    ): Promise<void> {
        await callCloudflareApi(
            account,
            `/zones/${zone.cfZoneId}/firewall/access_rules/rules/${ruleId}`,
            { method: 'DELETE' }
        )

        // Audit log
        if (user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SECURITY_IP_RULE_DELETE',
                    target: zone.name,
                    details: `Deleted firewall access rule ${ruleId}`
                }
            }).catch(e => console.warn('[AuditLog] Failed to record:', e.message))
        }
    }

    /**
     * List WAF Custom Rules (Ruleset Engine Phase)
     */
    static async listWafRules(account: any, cfZoneId: string): Promise<WafCustomRule[]> {
        try {
            const res = await callCloudflareApi(
                account,
                `/zones/${cfZoneId}/rulesets/phases/http_request_firewall_custom/entrypoint`
            )

            const ruleset = res.result
            if (!ruleset || !ruleset.rules) return []

            return ruleset.rules.map((r: any) => ({
                id: r.id,
                rulesetId: ruleset.id,
                description: r.description || 'Custom WAF Rule',
                expression: r.expression || '',
                action: r.action || 'block',
                enabled: r.enabled !== false,
                lastUpdated: r.last_updated || new Date().toISOString()
            }))
        } catch (e: any) {
            // If it is a permission issue, rethrow so the endpoint can inform the user
            if (this.isPermissionError(e.message)) {
                throw e
            }
            // If ruleset doesn't exist yet on Cloudflare, return empty array gracefully
            console.info(`[CloudflareSecurity] No custom ruleset found for zone ${cfZoneId}: ${e.message}`)
            return []
        }
    }

    /**
     * Toggle a WAF Custom Rule Enabled/Disabled
     */
    static async toggleWafRule(
        account: any,
        zone: any,
        rulesetId: string,
        ruleId: string,
        enabled: boolean,
        user: any
    ): Promise<void> {
        await callCloudflareApi(
            account,
            `/zones/${zone.cfZoneId}/rulesets/${rulesetId}/rules/${ruleId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ enabled })
            }
        )

        // Audit log
        if (user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SECURITY_WAF_TOGGLE',
                    target: zone.name,
                    details: `Toggled WAF rule "${ruleId}" to ${enabled ? 'ENABLED' : 'DISABLED'}`
                }
            }).catch(e => console.warn('[AuditLog] Failed to record:', e.message))
        }
    }
}
