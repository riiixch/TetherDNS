<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'

interface AnalyticsData {
    data: {
        labels: string[]
        datasets: {
            label: string
            data: number[]
        }[]
    }
}

const props = defineProps<{
    initialData?: AnalyticsData
}>()

const { t } = useI18n()
const { data: analytics, pending: fetchPending } = useFetch<AnalyticsData>('/api/analytics/ip-changes', {
    default: () => props.initialData as AnalyticsData,
    immediate: !props.initialData
})
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const activeData = computed(() => props.initialData || analytics.value)
const isPending = computed(() => !props.initialData && fetchPending.value)

const datasetData = computed(() => activeData.value?.data?.datasets[0]?.data || [])
const labels = computed(() => activeData.value?.data?.labels || [])

const total = computed(() => datasetData.value.reduce((a, b) => a + b, 0))
const peakLabel = computed(() => {
    if (!datasetData.value.length) return '-'
    let max = -1
    let maxIdx = 0
    datasetData.value.forEach((v, i) => {
        if (v > max) {
            max = v
            maxIdx = i
        }
    })
    return labels.value[maxIdx] || '-'
})
const avg = computed(() => {
    const len = datasetData.value.length || 24
    return (total.value / len).toFixed(1)
})

const chartOptions = computed<ApexOptions>(() => ({
    chart: {
        id: 'ip-changes-chart',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 },
        background: 'transparent',
        fontFamily: "'JetBrains Mono', 'Anuphan', sans-serif"
    },
    xaxis: {
        categories: labels.value,
        labels: {
            style: {
                colors: isDark.value ? '#62728f' : '#64748b',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
            }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
            formatter: (val: number) => {
                return Number.isInteger(val) ? val.toString() : Math.round(val).toString()
            },
            style: {
                colors: isDark.value ? '#62728f' : '#64748b',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace"
            }
        }
    },
    stroke: {
        curve: 'smooth' as const,
        width: 2.5
    },
    colors: ['#12e08a'],
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: isDark.value ? 0.35 : 0.2,
            opacityTo: 0.0,
            stops: [0, 95]
        }
    },
    grid: {
        borderColor: isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
        strokeDashArray: 3,
        padding: { top: 10, right: 10, bottom: 0, left: 10 }
    },
    responsive: [
        {
            breakpoint: 640,
            options: {
                chart: {
                    height: 210
                },
                xaxis: {
                    labels: {
                        style: { fontSize: '9.5px' }
                    },
                    tickAmount: 4
                },
                yaxis: {
                    labels: {
                        style: { fontSize: '9.5px' }
                    },
                    tickAmount: 3
                }
            }
        }
    ],
    theme: {
        mode: isDark.value ? ('dark' as const) : ('light' as const)
    },
    tooltip: {
        theme: isDark.value ? ('dark' as const) : ('light' as const),
        x: { show: true },
        style: {
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace"
        }
    },
    dataLabels: { enabled: false },
    markers: {
        size: 0,
        colors: ['#12e08a'],
        strokeColors: isDark.value ? '#0c1322' : '#ffffff',
        strokeWidth: 2,
        hover: { size: 5 }
    }
}))

const series = computed(() => [
    {
        name: t('analytics.ip_changes'),
        data: datasetData.value
    }
])
</script>

<template>
    <div class="card chart-card flex flex-col h-full">
        <div class="card-head">
            <div class="card-title">
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-[var(--green)]" />
                <span>{{ $t('analytics.ip_changes') }}</span>
            </div>
            <span class="chip green">24H ACTIVITY</span>
        </div>

        <div class="chart-meta">
            <span class="meta-chip">Total <b>{{ total }}</b></span>
            <span class="meta-chip">Peak <b>{{ peakLabel }}</b></span>
            <span class="meta-chip">Avg <b>{{ avg }}</b></span>
        </div>

        <div class="flex-1 min-h-[190px] sm:min-h-[230px] lg:min-h-[260px] relative w-full pt-2">
            <div v-if="isPending" class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-7 h-7 animate-spin text-[var(--text3)]" />
            </div>
            <div v-else class="absolute inset-0">
                <ClientOnly>
                    <VueApexCharts type="area" height="100%" :options="chartOptions" :series="series" />
                </ClientOnly>
            </div>
        </div>
    </div>
</template>
