<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { ZoneAnalyticsData, ZoneAnalyticsResponse } from '~~/types/analytics'

const { t } = useI18n()
useHead({ title: t('analytics.title') })
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { fetchZones } = useZones()
const toast = useToast()

// State
const zones = ref<any[]>([])
const selectedZoneId = ref<string>('')
const timeRange = ref<'24h' | '7d' | '30d'>('24h')
const loading = ref(true)
const isRefreshing = ref(false)
const isDemoMode = ref(false)
const permissionRequired = ref(false)
const missingPermission = ref('Zone > Analytics > Read')
const accountLabel = ref('')
const errorMessage = ref<string | null>(null)
const analytics = ref<ZoneAnalyticsData | null>(null)
const showProxyNotice = ref(true)
const isQuickSecurityOpen = ref(false)

// Current Zone
const currentZone = computed(() => {
    return zones.value.find(z => z.cfZoneId === selectedZoneId.value || String(z.id) === selectedZoneId.value)
})

const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Load Zones list
const initZones = async () => {
    try {
        const list = await fetchZones()
        zones.value = list || []

        // Set initial zone from query param or first zone
        const qZone = route.query.zoneId as string
        if (qZone && zones.value.some(z => z.cfZoneId === qZone || String(z.id) === qZone)) {
            selectedZoneId.value = qZone
        } else if (zones.value.length > 0) {
            selectedZoneId.value = zones.value[0].cfZoneId
        }
    } catch (err: any) {
        console.error('Failed to load zones for analytics', err)
        errorMessage.value = err.message || 'Failed to load zones'
    }
}

// Fetch Analytics from API
const fetchAnalytics = async (bypassCache = false) => {
    if (!selectedZoneId.value) return

    if (bypassCache) {
        isRefreshing.value = true
    } else {
        loading.value = true
    }
    errorMessage.value = null

    try {
        const queryParams = new URLSearchParams({
            timeRange: timeRange.value,
            ...(bypassCache ? { refresh: '1' } : {}),
            ...(isDemoMode.value ? { demo: '1' } : {})
        })

        const res = await $fetch<ZoneAnalyticsResponse>(`/api/zones/${selectedZoneId.value}/analytics?${queryParams.toString()}`)
        if (res.data) {
            analytics.value = res.data
        }

        if (res.permissionRequired) {
            permissionRequired.value = true
            missingPermission.value = res.missingPermission || 'Zone > Analytics > Read'
            accountLabel.value = res.accountLabel || ''
        } else {
            permissionRequired.value = false
        }
    } catch (err: any) {
        console.error('Failed to fetch zone analytics', err)
        errorMessage.value = err.data?.message || err.message || 'Failed to load Cloudflare Analytics'
        toast.add({
            title: t('common.failed'),
            description: errorMessage.value || 'Error fetching analytics',
            color: 'error'
        })
    } finally {
        loading.value = false
        isRefreshing.value = false
    }
}

// Handlers
const changeZone = (zoneTag: string) => {
    if (selectedZoneId.value === zoneTag) return
    selectedZoneId.value = zoneTag
    router.replace({ query: { ...route.query, zoneId: zoneTag } })
    fetchAnalytics(false)
}

const setTimeRange = (range: '24h' | '7d' | '30d') => {
    if (timeRange.value === range) return
    timeRange.value = range
    fetchAnalytics(false)
}

const toggleDemoMode = () => {
    isDemoMode.value = !isDemoMode.value
    fetchAnalytics(true)
}

const handleManualRefresh = () => {
    fetchAnalytics(true)
}

// Watchers
watch(() => route.query.zoneId, (newZoneId) => {
    if (newZoneId && newZoneId !== selectedZoneId.value) {
        selectedZoneId.value = newZoneId as string
        fetchAnalytics(false)
    }
})

onMounted(async () => {
    await initZones()
    if (selectedZoneId.value) {
        await fetchAnalytics(false)
    } else {
        loading.value = false
    }
})
</script>

<template>
    <div class="space-y-6 flex flex-col h-full pb-12">
        <!-- Page Header -->
        <section class="page-head">
            <div class="ph-left">
                <div class="ph-icon">
                    <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-[var(--green)]" />
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <h1>{{ $t('analytics.title') }}</h1>
                        <span v-if="isDemoMode" class="pill warn">DEMO DATA</span>
                    </div>
                    <p class="sub">{{ $t('analytics.subtitle') }}</p>
                </div>
            </div>

            <!-- Controls in Header -->
            <div class="ph-right flex flex-wrap items-center gap-2">
                <!-- Time Range Selector -->
                <div class="inline-flex rounded-lg p-1 bg-[var(--surface2)] border border-[var(--border)] text-xs font-semibold">
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded transition-all mono cursor-pointer"
                        :class="timeRange === '24h' ? 'bg-[var(--green)] text-slate-950 font-bold shadow-sm' : 'text-[var(--text2)] hover:text-[var(--text1)]'"
                        @click="setTimeRange('24h')"
                    >
                        24H
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded transition-all mono cursor-pointer"
                        :class="timeRange === '7d' ? 'bg-[var(--green)] text-slate-950 font-bold shadow-sm' : 'text-[var(--text2)] hover:text-[var(--text1)]'"
                        @click="setTimeRange('7d')"
                    >
                        7D
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded transition-all mono cursor-pointer"
                        :class="timeRange === '30d' ? 'bg-[var(--green)] text-slate-950 font-bold shadow-sm' : 'text-[var(--text2)] hover:text-[var(--text1)]'"
                        @click="setTimeRange('30d')"
                    >
                        30D
                    </button>
                </div>

                <!-- Demo Toggle Button -->
                <button
                    type="button"
                    class="btn-ref ghost text-xs flex items-center gap-1.5 cursor-pointer"
                    :class="{ 'border-amber-500/40 text-[var(--amber)]': isDemoMode }"
                    @click="toggleDemoMode"
                >
                    <UIcon :name="isDemoMode ? 'i-heroicons-sparkles' : 'i-heroicons-cube'" class="w-3.5 h-3.5" />
                    <span>{{ isDemoMode ? 'Live Mode' : 'Demo Preview' }}</span>
                </button>

                <!-- Refresh Button -->
                <button
                    type="button"
                    class="btn-ref ghost cursor-pointer"
                    :disabled="loading || isRefreshing || !selectedZoneId"
                    @click="handleManualRefresh"
                >
                    <UIcon
                        name="i-heroicons-arrow-path"
                        class="w-4 h-4"
                        :class="{ 'animate-spin': isRefreshing || loading }"
                    />
                    <span>{{ isRefreshing ? 'Refreshing...' : $t('common.refresh') }}</span>
                </button>
            </div>
        </section>

        <!-- Native Zone Tabs (matching TetherDNS zones/[id].vue) -->
        <div v-if="zones.length > 0" class="zone-tabs overflow-x-auto pb-1 no-scrollbar">
            <button
                v-for="z in zones"
                :key="z.id"
                type="button"
                class="ztab text-left cursor-pointer"
                :class="{ on: z.cfZoneId === selectedZoneId }"
                @click="changeZone(z.cfZoneId)"
            >
                <UIcon name="i-heroicons-globe-alt" class="w-3.5 h-3.5 opacity-80" />
                <span class="truncate max-w-[150px] font-mono">{{ z.name }}</span>
                <span class="zcount">{{ z._count?.records ?? 0 }}</span>
            </button>
        </div>

        <!-- No Zones Empty State -->
        <div v-if="!loading && zones.length === 0" class="card py-16 text-center flex flex-col items-center justify-center">
            <UIcon name="i-heroicons-globe-alt" class="w-12 h-12 text-[var(--text3)] mb-3 opacity-60" />
            <h3 class="text-base font-bold text-[var(--text1)]">No Zones Configured</h3>
            <p class="text-xs text-[var(--text3)] mt-1 max-w-md">
                Add or import a domain zone into TetherDNS to begin collecting edge analytics and threat telemetry.
            </p>
            <NuxtLink to="/zones" class="btn-ref primary mt-4">
                <span>Manage Zones</span>
            </NuxtLink>
        </div>

        <template v-else>
            <!-- Missing Permission Guidance Banner -->
            <div
                v-if="permissionRequired && !isDemoMode"
                class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-[var(--text1)] space-y-3"
            >
                <div class="flex items-start gap-3">
                    <UIcon name="i-heroicons-key" class="w-5 h-5 text-[var(--amber)] shrink-0 mt-0.5" />
                    <div class="flex-1 space-y-1">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-[var(--amber)] text-sm">
                                Cloudflare API Token Permission Required
                            </span>
                            <span class="chip amber">{{ missingPermission }}</span>
                        </div>
                        <p class="text-[var(--text2)] leading-relaxed">
                            Cloudflare API Token สำหรับบัญชี <b>{{ accountLabel || 'Cloudflare' }}</b> ยังไม่ได้รับสิทธิ์ <b>{{ missingPermission }}</b> 
                            ทำให้ไม่สามารถดึงข้อมูลสถิติทราฟฟิกสดจาก Cloudflare ได้
                        </p>
                    </div>
                </div>

                <!-- 4 Steps instruction -->
                <div class="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-xs text-[var(--text2)] space-y-1.5">
                    <div class="font-semibold text-[var(--text1)] flex items-center gap-1.5">
                        <UIcon name="i-heroicons-wrench-screwdriver" class="w-3.5 h-3.5 text-[var(--cyan)]" />
                        วิธีเพิ่มสิทธิ์บน Cloudflare (ใช้เวลา 1 นาที):
                    </div>
                    <ol class="list-decimal list-inside space-y-1 pl-1 text-[var(--text3)] font-mono text-[11.5px]">
                        <li>ไปที่ <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" class="text-[var(--cyan)] underline">Cloudflare API Tokens</a></li>
                        <li>ค้นหาและกด <b>Edit</b> ที่ Token <b>{{ accountLabel || 'ของคุณ' }}</b></li>
                        <li>เพิ่ม Permission: <b>Zone</b> → <b>Analytics</b> → <b>Read</b></li>
                        <li>กด <b>Save</b> แล้วกลับมากดปุ่ม <b>"ลองใหม่อีกครั้ง"</b> ด้านล่าง</li>
                    </ol>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-1">
                    <a
                        href="https://dash.cloudflare.com/profile/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-ref ghost text-xs inline-flex items-center gap-1 text-[var(--cyan)]"
                    >
                        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                        <span>เปิด Cloudflare API Tokens</span>
                    </a>
                    <button
                        type="button"
                        class="btn-ref ghost text-xs inline-flex items-center gap-1"
                        @click="handleManualRefresh"
                    >
                        <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" />
                        <span>ลองใหม่อีกครั้ง (Retry)</span>
                    </button>
                    <button
                        type="button"
                        class="btn-ref ghost text-xs inline-flex items-center gap-1 text-[var(--amber)]"
                        @click="toggleDemoMode"
                    >
                        <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
                        <span>ดูตัวอย่างข้อมูลจำลอง (Demo Mode)</span>
                    </button>
                </div>
            </div>

            <!-- Dismissible Orange Cloud / Edge Proxied Informational Notice -->
            <div v-if="showProxyNotice" class="flex items-start justify-between gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-[var(--text2)]">
                <div class="flex items-start gap-2.5">
                    <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-[var(--cyan)] shrink-0 mt-0.5" />
                    <div class="space-y-0.5">
                        <span class="font-semibold text-[var(--cyan)]">Cloudflare Edge Proxy Note</span>
                        <p class="text-[var(--text3)] leading-relaxed">
                            {{ $t('analytics.dns_only_notice') }}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="text-[var(--text3)] hover:text-[var(--text1)] p-0.5 shrink-0 transition-colors"
                    title="Dismiss"
                    @click="showProxyNotice = false"
                >
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
            </div>

            <!-- Row 1: 4 Overview KPI Cards -->
            <AnalyticsOverviewCards
                :summary="analytics?.summary"
                :loading="loading"
            />

            <!-- Row 2: Traffic Time-Series Chart -->
            <AnalyticsTrafficTimeSeriesChart
                :time-series="analytics?.timeSeries"
                :loading="loading"
            />

            <!-- Row 3 & 4: Balanced 2x2 Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Card 1: HTTP Status Codes Donut & Breakdown -->
                <AnalyticsStatusCodeDonut
                    :status-codes="analytics?.statusCodes"
                    :loading="loading"
                />

                <!-- Card 2: Security & Mitigated Threats -->
                <AnalyticsThreatWidget
                    :threat-details="analytics?.threatDetails"
                    :total-threats="analytics?.summary?.threatsBlocked"
                    :threat-ratio="analytics?.summary?.threatRatio"
                    :zone-id="selectedZoneId"
                    :loading="loading"
                    @open-security="isQuickSecurityOpen = true"
                />

                <!-- Card 3: Top Traffic Countries -->
                <AnalyticsTopCountriesTable
                    :countries="analytics?.topCountries"
                    :loading="loading"
                />

                <!-- Card 4: Zone Edge Information -->
                <div class="card flex flex-col justify-between h-full">
                    <div class="card-head">
                        <div class="card-title">
                            <UIcon name="i-heroicons-server" class="w-4 h-4 text-[var(--cyan)]" />
                            <span>{{ $t('analytics.zone_overview') }}</span>
                        </div>
                        <span class="chip cyan">EDGE METRICS</span>
                    </div>

                    <div class="card-body space-y-3 text-xs">
                        <div class="flex items-center justify-between p-2 rounded bg-[var(--surface2)]">
                            <span class="text-[var(--text3)]">Domain:</span>
                            <span class="font-bold mono text-[var(--text1)]">{{ currentZone?.name || '-' }}</span>
                        </div>
                        <div class="flex items-center justify-between p-2 rounded bg-[var(--surface2)]">
                            <span class="text-[var(--text3)]">Cloudflare Zone ID:</span>
                            <span class="mono text-[11px] text-[var(--cyan)] truncate max-w-[200px]">{{ currentZone?.cfZoneId || '-' }}</span>
                        </div>
                        <div class="flex items-center justify-between p-2 rounded bg-[var(--surface2)]">
                            <span class="text-[var(--text3)]">Cache Performance:</span>
                            <span class="mono text-[11px] text-[var(--green)]">
                                {{ analytics?.summary?.cacheHitRatio ?? 0 }}% Hit Ratio ({{ formatBytes(analytics?.summary?.cachedBytes) }} Saved)
                            </span>
                        </div>
                        <div class="flex items-center justify-between p-2 rounded bg-[var(--surface2)]">
                            <span class="text-[var(--text3)]">Data Source:</span>
                            <span class="mono text-[11px]" :class="isDemoMode ? 'text-[var(--amber)]' : 'text-[var(--green)]'">
                                {{ isDemoMode ? 'Demo Simulation' : 'Live Cloudflare Edge' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between p-2 rounded bg-[var(--surface2)]">
                            <span class="text-[var(--text3)]">Cached at:</span>
                            <span class="mono text-[11px] text-[var(--text2)]">{{ analytics?.cachedAt ? new Date(analytics.cachedAt).toLocaleTimeString() : '-' }}</span>
                        </div>
                    </div>

                    <div class="px-5 pb-5 pt-0 flex items-center justify-between gap-2">
                        <NuxtLink
                            v-if="currentZone?.cfZoneId"
                            :to="`/zones/${currentZone.cfZoneId}`"
                            class="btn-ref ghost text-xs py-1.5 px-3 flex-1 justify-center inline-flex items-center gap-1.5"
                        >
                            <UIcon name="i-heroicons-queue-list" class="w-3.5 h-3.5 text-[var(--green)]" />
                            <span>{{ $t('analytics.dns_records') }}</span>
                        </NuxtLink>
                        <a
                            v-if="currentZone?.cfZoneId"
                            :href="`https://dash.cloudflare.com/?to=/:zone/analytics`"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn-ref ghost text-xs py-1.5 px-3 flex-1 justify-center inline-flex items-center gap-1.5"
                        >
                            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-[var(--cyan)]" />
                            <span>Cloudflare</span>
                        </a>
                    </div>
                </div>
            </div>
        </template>

        <!-- Quick Security Switcher Modal -->
        <SecurityQuickSecurityModal
            :is-open="isQuickSecurityOpen"
            :zone-id="selectedZoneId"
            :zone-name="currentZone?.name || ''"
            @close="isQuickSecurityOpen = false"
        />
    </div>
</template>
