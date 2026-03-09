<script setup lang="ts">
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
        animations: { enabled: true },
        background: 'transparent'
    },
    xaxis: {
        categories: analytics.value?.data?.labels || [],
        labels: {
            style: { colors: isDark.value ? '#94a3b8' : '#64748b' }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
    },
    yaxis: {
        labels: {
            style: { colors: isDark.value ? '#94a3b8' : '#64748b' }
        }
    },
    stroke: {
        curve: 'smooth' as const,
        width: 3
    },
    colors: ['#3b82f6'],
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [0, 100]
        }
    },
    grid: {
        borderColor: isDark.value ? '#1e293b' : '#e2e8f0',
        strokeDashArray: 4,
        padding: { left: 10, right: 10 }
    },
    theme: {
        mode: isDark.value ? 'dark' as const : 'light' as const
    },
    tooltip: {
        theme: isDark.value ? 'dark' : 'light'
    },
    markers: {
        size: 4,
        colors: ['#3b82f6'],
        strokeColors: isDark.value ? '#0f172a' : '#fff',
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
    <UCard>
        <template #header>
            <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-primary-500" />
                <h3 class="font-semibold">{{ $t('analytics.ip_changes') }}</h3>
            </div>
        </template>

        <div v-if="pending" class="h-64 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
        </div>
        <div v-else class="h-64">
            <ClientOnly>
                <VueApexCharts type="area" height="100%" :options="chartOptions" :series="series" />
            </ClientOnly>
        </div>
    </UCard>
</template>
