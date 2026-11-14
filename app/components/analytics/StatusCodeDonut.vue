<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { ZoneAnalyticsStatusCodes } from '~~/types/analytics'

const props = defineProps<{
    statusCodes?: ZoneAnalyticsStatusCodes
    loading?: boolean
}>()

const { t } = useI18n()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const counts = computed(() => ({
    '2xx': props.statusCodes?.['2xx'] || 0,
    '3xx': props.statusCodes?.['3xx'] || 0,
    '4xx': props.statusCodes?.['4xx'] || 0,
    '5xx': props.statusCodes?.['5xx'] || 0
}))

const total = computed(() => {
    return counts.value['2xx'] + counts.value['3xx'] + counts.value['4xx'] + counts.value['5xx']
})

const series = computed(() => [
    counts.value['2xx'],
    counts.value['3xx'],
    counts.value['4xx'],
    counts.value['5xx']
])

const calcPercent = (val: number) => {
    if (!total.value) return 0
    return Math.round((val / total.value) * 1000) / 10
}

const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0'
    return new Intl.NumberFormat().format(num)
}

const chartOptions = computed<ApexOptions>(() => ({
    chart: {
        id: 'status-codes-donut',
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
        background: 'transparent',
        fontFamily: "'JetBrains Mono', 'Anuphan', sans-serif"
    },
    labels: [
        t('analytics.status_2xx') || '2xx Success',
        t('analytics.status_3xx') || '3xx Redirect',
        t('analytics.status_4xx') || '4xx Client Err',
        t('analytics.status_5xx') || '5xx Server Err'
    ],
    colors: ['#12e08a', '#00e5ff', '#f59e0b', '#ff4757'],
    stroke: {
        colors: [isDark.value ? '#0c1322' : '#ffffff'],
        width: 2
    },
    plotOptions: {
        pie: {
            donut: {
                size: '72%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: t('analytics.total_responses') || 'Responses',
                        fontSize: '10px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isDark.value ? '#94a3b8' : '#64748b',
                        formatter: () => formatNumber(total.value)
                    },
                    value: {
                        fontSize: '17px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: '700',
                        color: isDark.value ? '#f8fafc' : '#0f172a',
                        formatter: (val: string) => formatNumber(Number(val))
                    }
                }
            }
        }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        y: {
            formatter: (val: number) => `${formatNumber(val)} (${calcPercent(val)}%)`
        }
    }
}))
</script>

<template>
    <div class="card flex flex-col h-full">
        <div class="card-head">
            <div class="card-title">
                <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-[var(--green)]" />
                <span>{{ $t('analytics.http_status_codes') }}</span>
            </div>
            <span class="chip green">HTTP STATUS</span>
        </div>

        <div class="card-body flex-1 flex flex-col justify-center">
            <div v-if="loading" class="flex items-center justify-center py-10">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
            </div>
            <div v-else-if="total === 0" class="flex flex-col items-center justify-center text-[var(--text3)] gap-2 py-10">
                <UIcon name="i-heroicons-circle-stack" class="w-8 h-8 opacity-40" />
                <span class="text-xs">{{ $t('analytics.no_status_data') }}</span>
            </div>
            <div v-else class="flex flex-col sm:flex-row items-center gap-6 justify-between">
                <!-- Donut Chart Left -->
                <div class="w-[170px] h-[170px] shrink-0 relative flex items-center justify-center">
                    <ClientOnly>
                        <VueApexCharts type="donut" width="170" height="170" :options="chartOptions" :series="series" />
                    </ClientOnly>
                </div>

                <!-- Status Bars Right -->
                <div class="flex-1 w-full space-y-2.5">
                    <!-- 2xx Success -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-medium text-[var(--green)]">
                                <span class="w-2 h-2 rounded-full bg-[#12e08a]"></span>
                                2xx Success
                            </span>
                            <span class="mono font-semibold">{{ formatNumber(counts['2xx']) }} <span class="text-[var(--text3)] font-normal">({{ calcPercent(counts['2xx']) }}%)</span></span>
                        </div>
                        <div class="w-full bg-[var(--surface2)] rounded-full h-1.5 overflow-hidden">
                            <div class="h-full bg-[#12e08a] rounded-full transition-all duration-500" :style="{ width: `${calcPercent(counts['2xx'])}%` }"></div>
                        </div>
                    </div>

                    <!-- 3xx Redirect -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-medium text-[var(--cyan)]">
                                <span class="w-2 h-2 rounded-full bg-[#00e5ff]"></span>
                                3xx Redirection
                            </span>
                            <span class="mono font-semibold">{{ formatNumber(counts['3xx']) }} <span class="text-[var(--text3)] font-normal">({{ calcPercent(counts['3xx']) }}%)</span></span>
                        </div>
                        <div class="w-full bg-[var(--surface2)] rounded-full h-1.5 overflow-hidden">
                            <div class="h-full bg-[#00e5ff] rounded-full transition-all duration-500" :style="{ width: `${calcPercent(counts['3xx'])}%` }"></div>
                        </div>
                    </div>

                    <!-- 4xx Client Error -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-medium text-[var(--amber)]">
                                <span class="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                                4xx Client Error
                            </span>
                            <span class="mono font-semibold">{{ formatNumber(counts['4xx']) }} <span class="text-[var(--text3)] font-normal">({{ calcPercent(counts['4xx']) }}%)</span></span>
                        </div>
                        <div class="w-full bg-[var(--surface2)] rounded-full h-1.5 overflow-hidden">
                            <div class="h-full bg-[#f59e0b] rounded-full transition-all duration-500" :style="{ width: `${calcPercent(counts['4xx'])}%` }"></div>
                        </div>
                    </div>

                    <!-- 5xx Server Error -->
                    <div class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="flex items-center gap-1.5 font-medium text-[#ff4757]">
                                <span class="w-2 h-2 rounded-full bg-[#ff4757]"></span>
                                5xx Server Error
                            </span>
                            <span class="mono font-semibold">{{ formatNumber(counts['5xx']) }} <span class="text-[var(--text3)] font-normal">({{ calcPercent(counts['5xx']) }}%)</span></span>
                        </div>
                        <div class="w-full bg-[var(--surface2)] rounded-full h-1.5 overflow-hidden">
                            <div class="h-full bg-[#ff4757] rounded-full transition-all duration-500" :style="{ width: `${calcPercent(counts['5xx'])}%` }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
