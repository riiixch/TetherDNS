export interface DnsZone {
    id: string
    name: string
    status?: string
}

export interface DnsRecord {
    id: string
    type: string
    name: string
    content: string
    ttl: number
    proxied: boolean
    priority?: number
}

export interface DnsProvider {
    // Connection verification
    testConnection(): Promise<boolean>

    // Zone management
    listZones(): Promise<DnsZone[]>
    getZone(zoneId: string): Promise<DnsZone | null>

    // Record management
    listRecords(zoneId: string): Promise<DnsRecord[]>
    createRecord(zoneId: string, record: Partial<DnsRecord>): Promise<DnsRecord>
    updateRecord(zoneId: string, recordId: string, record: Partial<DnsRecord>): Promise<DnsRecord>
    deleteRecord(zoneId: string, recordId: string): Promise<void>
}
