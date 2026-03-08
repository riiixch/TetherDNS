<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = ref<any>(null)
const pending = ref(true)

const loadStats = async () => {
    pending.value = true
    try {
        const res = await $fetch<{ data: any }>('/api/dashboard/stats')
        stats.value = res.data
    } catch { /* ignore */ } finally {
        pending.value = false
    }
}

onMounted(() => loadStats())

const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
}
</script>

<template>
    <div v-if="!pending && stats" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <!-- Accounts -->
        <UCard>
            <div class="text-center">
                <p class="text-2xl font-bold text-primary">{{ stats.totalAccounts }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.stats_accounts') }}</p>
            </div>
        </UCard>

        <!-- Zones -->
        <UCard>
            <div class="text-center">
                <p class="text-2xl font-bold text-blue-400">{{ stats.totalZones }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.stats_zones') }}</p>
            </div>
        </UCard>

        <!-- Records -->
        <UCard>
            <div class="text-center">
                <p class="text-2xl font-bold text-purple-400">{{ stats.totalRecords }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.stats_records') }}</p>
            </div>
        </UCard>

        <!-- DDNS Enabled -->
        <UCard>
            <div class="text-center">
                <p class="text-2xl font-bold text-green-400">{{ stats.ddnsEnabledCount }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.stats_ddns') }}</p>
            </div>
        </UCard>

        <!-- Current IP -->
        <UCard>
            <div class="text-center">
                <p class="text-lg font-bold font-mono text-yellow-400">{{ stats.currentIp }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.stats_current_ip') }}</p>
            </div>
        </UCard>

        <!-- Last Update -->
        <UCard>
            <div class="text-center">
                <template v-if="stats.lastUpdate">
                    <UBadge :color="stats.lastUpdate.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle"
                        class="mb-1">
                        {{ stats.lastUpdate.status }}
                    </UBadge>
                    <p class="text-xs text-gray-400">{{ formatTime(stats.lastUpdate.time) }}</p>
                </template>
                <template v-else>
                    <p class="text-sm text-gray-500">-</p>
                </template>
                <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.stats_last_update') }}</p>
            </div>
        </UCard>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="pending" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <UCard v-for="i in 6" :key="i">
            <div class="text-center">
                <div class="h-7 w-12 mx-auto rounded bg-gray-700 animate-pulse" />
                <div class="h-3 w-16 mx-auto mt-2 rounded bg-gray-700 animate-pulse" />
            </div>
        </UCard>
    </div>
</template>
