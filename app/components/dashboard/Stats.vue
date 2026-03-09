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
    <div v-if="!pending && stats" class="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <!-- Accounts -->
        <UCard
            class="bg-slate-900/50 backdrop-blur-md border-slate-800/50 group hover:border-primary-500/50 transition-all duration-300">
            <div class="flex flex-col items-center justify-center p-1">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-primary-400" />
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-primary-400 transition-colors">
                        {{ $t('dashboard.stats_accounts') }}
                    </span>
                </div>
                <p class="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {{ stats.totalAccounts }}
                </p>
            </div>
        </UCard>

        <!-- Zones -->
        <UCard
            class="bg-slate-900/50 backdrop-blur-md border-slate-800/50 group hover:border-blue-500/50 transition-all duration-300">
            <div class="flex flex-col items-center justify-center p-1">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-blue-400" />
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-400 transition-colors">
                        {{ $t('dashboard.stats_zones') }}
                    </span>
                </div>
                <p class="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {{ stats.totalZones }}
                </p>
            </div>
        </UCard>

        <!-- Records -->
        <UCard
            class="bg-slate-900/50 backdrop-blur-md border-slate-800/50 group hover:border-purple-500/50 transition-all duration-300">
            <div class="flex flex-col items-center justify-center p-1">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-list-bullet" class="w-4 h-4 text-purple-400" />
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-400 transition-colors">
                        {{ $t('dashboard.stats_records') }}
                    </span>
                </div>
                <p class="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {{ stats.totalRecords }}
                </p>
            </div>
        </UCard>

        <!-- DDNS Enabled -->
        <UCard
            class="bg-slate-900/50 backdrop-blur-md border-slate-800/50 group hover:border-emerald-500/50 transition-all duration-300">
            <div class="flex flex-col items-center justify-center p-1">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-emerald-400" />
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-400 transition-colors">
                        {{ $t('dashboard.stats_ddns') }}
                    </span>
                </div>
                <p class="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {{ stats.ddnsEnabledCount }}
                </p>
            </div>
        </UCard>

        <!-- Current IP -->
        <UCard
            class="bg-slate-900/50 backdrop-blur-md border-slate-800/50 group hover:border-amber-500/50 transition-all duration-300 group">
            <div class="flex flex-col items-center justify-center p-1">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-amber-400" />
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-400 transition-colors">
                        {{ $t('dashboard.stats_current_ip') }}
                    </span>
                </div>
                <p
                    class="text-base font-mono font-bold text-amber-100 group-hover:text-amber-400 transition-colors truncate w-full text-center">
                    {{ stats.currentIp }}
                </p>
            </div>
        </UCard>

        <!-- Last Update -->
        <UCard
            class="bg-slate-900/50 backdrop-blur-md border-slate-800/50 group hover:border-sky-500/50 transition-all duration-300">
            <div class="flex flex-col items-center justify-center p-1">
                <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-sky-400" />
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-sky-400 transition-colors">
                        {{ $t('dashboard.stats_last_update') }}
                    </span>
                </div>
                <template v-if="stats.lastUpdate">
                    <div class="flex flex-col items-center">
                        <UBadge :color="stats.lastUpdate.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle"
                            class="mb-1 text-[10px] px-2 py-0.5 font-bold uppercase rounded-full">
                            {{ stats.lastUpdate.status }}
                        </UBadge>
                        <p class="text-[10px] font-medium text-slate-400">{{ formatTime(stats.lastUpdate.time) }}</p>
                    </div>
                </template>
                <template v-else>
                    <p class="text-sm font-bold text-slate-600">-</p>
                </template>
            </div>
        </UCard>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="pending" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <UCard v-for="i in 6" :key="i" class="bg-slate-900/50 border-slate-800/50">
            <div class="flex flex-col items-center justify-center">
                <div class="h-3 w-16 mb-4 rounded bg-slate-800 animate-pulse" />
                <div class="h-8 w-12 rounded bg-slate-800 animate-pulse" />
            </div>
        </UCard>
    </div>
</template>
