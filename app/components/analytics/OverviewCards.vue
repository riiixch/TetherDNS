<script setup lang="ts">
import type { ZoneAnalyticsSummary } from '~~/types/analytics'

const props = defineProps<{
    summary?: ZoneAnalyticsSummary | null
    loading?: boolean
}>()

const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0'
    return new Intl.NumberFormat().format(num)
}

const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
    <section class="stats-4">
        <!-- Card 1: Total Requests -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic cyan">
                    <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('analytics.total_requests') }}</span>
                <span v-if="loading" class="ml-auto">
                    <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin text-[var(--text3)]" />
                </span>
            </div>
            <div class="stat-num mono text-[var(--cyan)]">
                {{ formatNumber(summary?.totalRequests) }}
            </div>
            <div class="stat-sub truncate">
                {{ $t('analytics.cached') }}: {{ formatNumber(summary?.cachedRequests) }} ({{ summary?.cacheHitRatio ?? 0 }}%)
            </div>
        </div>

        <!-- Card 2: Bandwidth (Data Transferred) -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic green">
                    <UIcon name="i-heroicons-cloud-arrow-down" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('analytics.bandwidth_served') }}</span>
                <span v-if="loading" class="ml-auto">
                    <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin text-[var(--text3)]" />
                </span>
            </div>
            <div class="stat-num mono text-[var(--green)]">
                {{ formatBytes(summary?.totalBytes) }}
            </div>
            <div class="stat-sub truncate">
                {{ $t('analytics.edge_saved') }}: {{ formatBytes(summary?.cachedBytes) }} ({{ summary?.bytesSavedRatio ?? 0 }}%)
            </div>
        </div>

        <!-- Card 3: Threats Blocked -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic rose">
                    <UIcon name="i-heroicons-shield-exclamation" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('analytics.threats_blocked') }}</span>
                <span v-if="loading" class="ml-auto">
                    <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin text-[var(--text3)]" />
                </span>
            </div>
            <div class="stat-num mono text-[var(--danger)]">
                {{ formatNumber(summary?.threatsBlocked) }}
            </div>
            <div class="stat-sub truncate">
                {{ $t('analytics.threat_ratio') }}: {{ summary?.threatRatio ?? 0 }}% {{ $t('analytics.of_traffic') }}
            </div>
        </div>

        <!-- Card 4: Cache Hit Ratio -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic amber">
                    <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('analytics.cache_hit_ratio') }}</span>
                <span v-if="loading" class="ml-auto">
                    <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin text-[var(--text3)]" />
                </span>
            </div>
            <div class="stat-num mono text-[var(--amber)]">
                {{ summary?.cacheHitRatio ?? 0 }}%
            </div>
            <div class="stat-sub truncate">
                {{ $t('analytics.visitors_count') }}: {{ formatNumber(summary?.uniqueVisitors) }} • {{ $t('analytics.views_count') }}: {{ formatNumber(summary?.pageviews) }}
            </div>
        </div>
    </section>
</template>
