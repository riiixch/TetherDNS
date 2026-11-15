<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { ZoneAnalyticsTimeSeriesPoint } from '~~/types/analytics'

const props = defineProps<{
    timeSeries?: ZoneAnalyticsTimeSeriesPoint[]
    loading?: boolean
}>()

const { t } = useI18n()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const points = computed(() => props.timeSeries || [])
const labels = computed(() => points.value.map(p => p.timeLabel))

const totalRequestsSeries = computed(() => points.value.map(p => p.requests))
const cachedRequestsSeries = computed(() => points.value.map(p => p.cached))
const threatsSeries = computed(() => points.value.map(p => p.threats))

const totalRequests = computed(() => totalRequestsSeries.value.reduce((a, b) => a + b, 0))
const peakRequests = computed(() => {
    if (!totalRequestsSeries.value.length) return 0
    return Math.max(...totalRequestsSeries.value)
})

const series = computed(() => [
    {
        name: t('analytics.total_requests') || 'Total Requests',
        data: totalRequestsSeries.value
    },
    {
        name: t('analytics.cached_requests') || 'Cached Requests',
        data: cachedRequestsSeries.value
    },
    {
        name: t('analytics.threats_mitigated') || 'Threats Mitigated',
        data: threatsSeries.value
    }
])

const chartOptions = computed<ApexOptions>(() => ({
    chart: {
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
        background: 'transparent',
        fontFamily: "'JetBrains Mono', 'Anuphan', sans-serif"
    },
    xaxis: {
        type: 'category',
        categories: labels.value,
        labels: {
            style: {
                colors: isDark.value ? '#62728f' : '#64748b',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
            },
            rotate: -45,
            rotateAlways: false,
            hideOverlappingLabels: true
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        labels: {
            style: {
                colors: isDark.value ? '#62728f' : '#64748b',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
            },
            formatter: (val: number) => {
                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
                if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
                return Math.round(val).toString()
            }
        }
    },
    stroke: {
        curve: 'smooth' as const,
        width: [2.5, 2, 2]
    },
    colors: ['#00e5ff', '#12e08a', '#ff4757'],
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: isDark.value ? 0.35 : 0.2,
            opacityTo: 0.02,
            stops: [0, 95]
        }
    },
    grid: {
        borderColor: isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
        strokeDashArray: 3,
        padding: { top: 10, right: 10, bottom: 0, left: 10 }
    },
    theme: {
        mode: isDark.value ? ('dark' as const) : ('light' as const)
    },
    tooltip: {
        theme: isDark.value ? ('dark' as const) : ('light' as const),
        x: { show: true },
        y: {
            formatter: (val: number) => new Intl.NumberFormat().format(val)
        },
        style: {
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace"
        }
    },
    dataLabels: { enabled: false },
    legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: {
            colors: isDark.value ? '#a0aec0' : '#4a5568'
        },
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        markers: {
            size: 6,
            shape: 'circle'
        }
    },
    markers: {
        size: 0,
        hover: { size: 5 }
    },
    responsive: [
        {
            breakpoint: 640,
            options: {
                chart: {
                    height: 220
                },
                legend: {
                    position: 'bottom',
                    horizontalAlign: 'center',
                    fontSize: '11px'
                },
                xaxis: {
                    tickAmount: 4
                },
                yaxis: {
                    tickAmount: 3
                }
            }
        }
    ]
}))
</script>

<template>
    <div class="card chart-card flex flex-col">
        <div class="card-head">
            <div class="card-title">
                <UIcon name="i-heroicons-presentation-chart-line" class="w-4 h-4 text-[var(--cyan)]" />
                <span>{{ $t('analytics.traffic_over_time') }}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="chip cyan">TIME SERIES</span>
            </div>
        </div>

        <div class="chart-meta">
            <span class="meta-chip">{{ $t('analytics.total') }} <b>{{ new Intl.NumberFormat().format(totalRequests) }}</b></span>
            <span class="meta-chip">{{ $t('analytics.peak') }} <b>{{ new Intl.NumberFormat().format(peakRequests) }}</b></span>
            <span class="meta-chip">{{ $t('analytics.points') }} <b>{{ points.length }}</b></span>
        </div>

        <div class="min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] h-[230px] sm:h-[300px] lg:h-[320px] w-full relative px-2 pt-2">
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
            </div>
            <div v-else-if="!points.length || totalRequests === 0" class="absolute inset-0 flex flex-col items-center justify-center text-[var(--text3)] gap-2">
                <UIcon name="i-heroicons-chart-bar" class="w-10 h-10 opacity-40" />
                <span class="text-xs">{{ $t('analytics.no_traffic_data') }}</span>
            </div>
            <div v-else class="h-full w-full">
                <ClientOnly>
                    <VueApexCharts
                        :key="`traffic-chart-${points.length}-${labels[0] || ''}-${labels[labels.length - 1] || ''}`"
                        type="area"
                        height="100%"
                        :options="chartOptions"
                        :series="series"
                    />
                </ClientOnly>
            </div>
        </div>
    </div>
</template>
