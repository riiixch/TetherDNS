export interface ZoneAnalyticsSummary {
    totalRequests: number
    cachedRequests: number
    uncachedRequests: number
    cacheHitRatio: number
    totalBytes: number
    cachedBytes: number
    bytesSavedRatio: number
    threatsBlocked: number
    threatRatio: number
    uniqueVisitors: number
    pageviews: number
}

export interface ZoneAnalyticsTimeSeriesPoint {
    timestamp: string
    timeLabel: string
    requests: number
    cached: number
    threats: number
    bytes: number
}

export interface ZoneAnalyticsStatusCodes {
    '2xx': number
    '3xx': number
    '4xx': number
    '5xx': number
}

export interface ZoneAnalyticsCountry {
    country: string
    name: string
    requests: number
    percentage: number
}

export interface ZoneAnalyticsThreatDetails {
    wafMitigated: number
    botMitigated: number
    rateLimited: number
}

export interface ZoneAnalyticsData {
    zoneId: string
    timeRange: '24h' | '7d' | '30d'
    from: string
    to: string
    cachedAt: string
    summary: ZoneAnalyticsSummary
    timeSeries: ZoneAnalyticsTimeSeriesPoint[]
    statusCodes: ZoneAnalyticsStatusCodes
    topCountries: ZoneAnalyticsCountry[]
    threatDetails: ZoneAnalyticsThreatDetails
}

export interface ZoneAnalyticsResponse {
    success: boolean
    permissionRequired?: boolean
    missingPermission?: string
    accountLabel?: string
    message?: string
    isDemo?: boolean
    data: ZoneAnalyticsData
    zone: {
        id: number
        name: string
        cfZoneId: string
    }
}
