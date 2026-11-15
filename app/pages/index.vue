<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { t } = useI18n()
useHead({ title: t('dashboard.title') })

definePageMeta({ layout: 'default' })

const { fetchLogs } = useLogs()
const { fetchZones } = useZones()
const { startLoading, stopLoading, isLoading } = useAppLoading()

const initialStats = ref<any>(null)
const initialAnalytics = ref<any>(null)

const recentLogs = ref<any[]>([])
const pendingLogs = ref(true)
const zones = ref<any[]>([])
const isSyncing = ref(false)
const statsRef = ref<any>(null)

const toast = useToast()

const loadRecentLogs = async () => {
    pendingLogs.value = true
    try {
        const res = await fetchLogs({ page: 1, limit: 6 })
        recentLogs.value = res.data || []
    } catch (e) {
        console.error('Failed to load recent logs', e)
    } finally {
        pendingLogs.value = false
    }
}

const loadZones = async () => {
    try {
        zones.value = await fetchZones()
    } catch (e) {
        console.error('Failed to load zones', e)
    }
}

const initDashboard = async () => {
    startLoading(t('dashboard.loading_dashboard') || 'Loading Dashboard...', t('dashboard.subtitle') || 'Cloudflare DDNS & Edge Manager')
    try {
        await Promise.allSettled([
            loadRecentLogs(),
            loadZones(),
            $fetch<{ data: any }>('/api/dashboard/stats').then(res => { initialStats.value = res?.data }),
            $fetch<any>('/api/analytics/ip-changes').then(res => { initialAnalytics.value = res })
        ])
    } catch (e) {
        console.error('Failed to initialize dashboard', e)
    } finally {
        stopLoading(350)
    }
}

const handleSync = async () => {
    isSyncing.value = true
    try {
        await Promise.all([
            loadRecentLogs(),
            loadZones(),
            statsRef.value?.refresh?.()
        ])
        toast.add({ title: t('common.success'), description: 'Data synchronized successfully', color: 'success' })
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message || 'Sync failed', color: 'error' })
    } finally {
        setTimeout(() => {
            isSyncing.value = false
        }, 600)
    }
}

const timeAgo = (dateStr: string) => {
    if (!dateStr) return '-'
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.years_ago')
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.months_ago')
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.days_ago')
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.hours_ago')
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.mins_ago')
    return Math.floor(seconds) + ' ' + t('times.seconds_ago')
}

onMounted(() => {
    initDashboard()
})
</script>

<template>
    <div class="relative w-full">
        <!-- Main Dashboard Content Container -->
        <div
            class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10 transition-opacity duration-300"
            :class="{ 'opacity-0': isLoading, 'opacity-100': !isLoading }"
        >
            <!-- Page Header matching ref.html -->
            <section class="page-head">
                <div class="ph-left">
                    <div class="ph-icon">
                        <UIcon name="i-heroicons-squares-2x2-solid" class="w-6 h-6 text-[var(--green)]" />
                    </div>
                    <div>
                        <h1>{{ $t('dashboard.title') }}</h1>
                        <p class="sub">{{ $t('dashboard.subtitle') }}</p>
                    </div>
                </div>
                <div class="ph-right">
                    <span class="live-pill">
                        <span class="pulse"></span>
                        LIVE
                    </span>
                    <button
                        type="button"
                        class="btn-ref ghost"
                        :disabled="isSyncing"
                        @click="handleSync"
                    >
                        <UIcon
                            name="i-heroicons-arrow-path"
                            class="w-4 h-4"
                            :class="{ 'animate-spin': isSyncing }"
                        />
                        <span>{{ isSyncing ? 'Syncing...' : $t('common.refresh') }}</span>
                    </button>
                </div>
            </section>

            <!-- 6 Stat Cards with Pre-fetched Data -->
            <ClientOnly>
                <DashboardStats ref="statsRef" :initial-data="initialStats" />
            </ClientOnly>

            <!-- Main Chart & Recent Updates Feed Grid -->
            <section class="dash-grid">
                <!-- Left: IP Mutation Frequency Chart with Pre-fetched Data -->
                <div class="h-full min-h-[220px] sm:min-h-[280px] lg:min-h-[380px]">
                    <ClientOnly>
                        <AnalyticsIpChangeChart :initial-data="initialAnalytics" />
                    </ClientOnly>
                </div>

            <!-- Right: Recent Updates Feed -->
            <div class="card feed-card flex flex-col h-full">
                <div class="card-head">
                    <div class="card-title">
                        <UIcon name="i-heroicons-clock" class="w-4 h-4 text-[var(--cyan)]" />
                        <span>{{ $t('dashboard.recent_updates') }}</span>
                    </div>
                    <NuxtLink to="/logs" class="link text-xs font-semibold">
                        {{ $t('dashboard.view_all') }}
                    </NuxtLink>
                </div>

                <div class="feed flex-1 overflow-y-auto">
                    <template v-if="pendingLogs">
                        <div class="feed-empty flex items-center justify-center p-8">
                            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--text3)]" />
                        </div>
                    </template>
                    <template v-else-if="recentLogs.length === 0">
                        <div class="feed-empty">
                            {{ $t('logs.no_logs') }}
                        </div>
                    </template>
                    <template v-else>
                        <div
                            v-for="log in recentLogs"
                            :key="log.id"
                            class="feed-item"
                        >
                            <span
                                class="dot"
                                :class="log.status === 'SUCCESS' ? 'ok' : 'failed'"
                            ></span>
                            <div class="fi-main">
                                <div class="fi-host mono truncate">
                                    {{ log.record?.name || 'record' }}
                                </div>
                                <div class="fi-ips mono">
                                    <span>{{ log.oldIp || '-' }}</span>
                                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-[var(--text3)]" />
                                    <b :class="log.status === 'SUCCESS' ? 'text-[var(--green)]' : 'text-[var(--danger)]'">
                                        {{ log.newIp || '-' }}
                                    </b>
                                </div>
                            </div>
                            <span class="fi-time whitespace-nowrap">
                                {{ timeAgo(log.createdAt) }}
                            </span>
                        </div>
                    </template>
                </div>
            </div>
        </section>

        <!-- Zone Health & Network Promo Grid -->
        <section class="dash-grid">
            <!-- Zone Health Card -->
            <div class="card hz-card flex flex-col">
                <div class="card-head" style="padding-bottom: 8px;">
                    <div class="card-title">
                        <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-[var(--green)]" />
                        <span>{{ $t('dashboard.stats_zones') }}</span>
                    </div>
                    <NuxtLink to="/zones" class="link text-xs font-semibold">
                        {{ $t('dashboard.view_all') }}
                    </NuxtLink>
                </div>

                <div v-if="zones.length === 0" class="p-6 text-center text-xs text-[var(--text3)]">
                    No active zones found.
                </div>
                <div v-else class="divide-y divide-[var(--border)]">
                    <div
                        v-for="z in zones.slice(0, 4)"
                        :key="z.cfZoneId || z.id"
                        class="hz-row cursor-pointer group"
                        @click="navigateTo(`/zones/${z.cfZoneId || z.id}`)"
                    >
                        <div class="hz-name">
                            <span class="dot ok"></span>
                            <span class="mono font-semibold">{{ z.name }}</span>
                            <span class="chip">{{ z.account?.label || 'Pro' }}</span>
                        </div>
                        <div class="hz-nums">
                            <span><b>{{ z._count?.records ?? 0 }}</b> records</span>
                        </div>
                        <div class="hz-bar">
                            <span style="width: 100%;"></span>
                        </div>
                        <span class="pill ok">ACTIVE</span>
                        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-[var(--text3)] group-hover:text-[var(--text)] transition-colors" />
                    </div>
                </div>
            </div>

            <!-- Promo Card matching ref.html -->
            <div class="promo">
                <svg class="promo-svg" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                    <circle cx="150" cy="150" r="70" stroke="rgba(255,255,255,.2)" stroke-width="1.5" />
                    <circle cx="150" cy="150" r="45" stroke="rgba(255,255,255,.3)" stroke-width="1.5" />
                    <circle cx="150" cy="150" r="20" fill="rgba(255,255,255,.15)" />
                    <circle cx="60" cy="60" r="4" fill="#fff" />
                    <circle cx="100" cy="40" r="3" fill="rgba(255,255,255,.7)" />
                    <path d="M60 60L100 40M60 60l30 50" stroke="rgba(255,255,255,.35)" />
                </svg>
                <h3>{{ $t('dashboard.scale_title') }}</h3>
                <p>{{ $t('dashboard.scale_desc') }}</p>
                <button
                    type="button"
                    class="btn-ref promo-btn"
                    @click="navigateTo('/settings')"
                >
                    <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
                    <span>{{ $t('dashboard.btn_global_settings') }}</span>
                </button>
            </div>
        </section>
    </div>
    </div>
</template>
