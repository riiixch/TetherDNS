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

const { data: analytics, pending } = await useFetch<AnalyticsData>('/api/analytics/ip-changes')

const chartOptions = computed(() => ({
    chart: {
        id: 'ip-changes-chart',
        toolbar: { show: false },
        animations: { enabled: true }
    },
    xaxis: {
        categories: analytics.value?.data?.labels || [],
        labels: {
            style: { colors: '#94a3b8' }
        }
    },
    yaxis: {
        labels: {
            style: { colors: '#94a3b8' }
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
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
        }
    },
    grid: {
        borderColor: '#1e293b',
        strokeDashArray: 4
    },
    theme: {
        mode: 'dark' as const
    }
}))

const series = computed(() => [
    {
        name: 'IP Changes',
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
