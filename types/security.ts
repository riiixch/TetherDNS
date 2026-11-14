export type SecurityLevel = 'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack'
export type AccessRuleMode = 'block' | 'challenge' | 'whitelist' | 'js_challenge' | 'managed_challenge'
export type AccessRuleTarget = 'ip' | 'ip_range' | 'asn' | 'country'

export interface ZoneSecuritySettings {
    zoneId: string
    securityLevel: SecurityLevel
    challengeTtl: number
    browserCheck: 'on' | 'off'
    modifiedOn: string | null
    isUnderAttack: boolean
}

export interface IpAccessRule {
    id: string
    mode: AccessRuleMode
    target: AccessRuleTarget
    value: string
    notes: string
    createdOn: string
    modifiedOn: string | null
    allowedModes: AccessRuleMode[]
}

export interface WafCustomRule {
    id: string
    rulesetId?: string
    description: string
    expression: string
    action: 'block' | 'challenge' | 'managed_challenge' | 'js_challenge' | 'log' | 'skip'
    enabled: boolean
    lastUpdated: string
}
