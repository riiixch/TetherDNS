<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface AnalyticsData {
    data: {
        labels: string[]
        datasets: {
            label: string
            data: number[]
        }[]
    }
}

const { t } = useI18n()
const { data: analytics, pending } = await useFetch<AnalyticsData>('/api/analytics/ip-changes')
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const chartOptions = computed(() => ({
    chart: {
        id: 'ip-changes-chart',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 },
        background: 'transparent',
        fontFamily: 'inherit'
    },
    xaxis: {
        categories: analytics.value?.data?.labels || [],
        labels: {
            style: { colors: isDark.value ? '#94a3b8' : '#64748b', fontWeight: 500 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        labels: {
            style: { colors: isDark.value ? '#94a3b8' : '#64748b', fontWeight: 500 }
        }
    },
    stroke: {
        curve: 'smooth' as const,
        width: 3
    },
    colors: ['#3b82f6'], // Primary Blue
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: isDark.value ? 0.4 : 0.2,
            opacityTo: 0.0,
            stops: [0, 100]
        }
    },
    grid: {
        borderColor: isDark.value ? '#334155' : '#e2e8f0', // slate-700 : slate-200
        strokeDashArray: 4,
        padding: { top: 0, right: 0, bottom: 0, left: 10 }
    },
    theme: {
        mode: isDark.value ? 'dark' as const : 'light' as const
    },
    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        x: { show: true }
    },
    dataLabels: { enabled: false },
    markers: {
        size: 0,
        colors: ['#3b82f6'],
        strokeColors: isDark.value ? '#0f172a' : '#ffffff',
        strokeWidth: 2,
        hover: { size: 6 }
    }
}))

const series = computed(() => [
    {
        name: t('analytics.ip_changes'),
        data: analytics.value?.data?.datasets[0]?.data || []
    }
])
</script>

<template>
    <UCard :ui="{ body: 'px-4 py-5 sm:p-6 h-full flex flex-col' }"
        class="bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm h-full">

        <div
            class="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-2">
                <div class="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                    <UIcon name="i-heroicons-chart-bar-solid" class="w-5 h-5 text-primary-500" />
                </div>
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {{ $t('analytics.ip_changes') }}
                </h3>
            </div>
            <UBadge variant="soft" color="primary" class="font-bold tracking-wide">24H Activity</UBadge>
        </div>

        <div class="flex-1 min-h-[300px] relative">
            <div v-if="pending" class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500" />
            </div>
            <div v-else class="absolute inset-0">
                <VueApexCharts type="area" height="100%" :options="chartOptions" :series="series" />
            </div>
        </div>
    </UCard>
</template>