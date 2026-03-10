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

const { locale } = useI18n()

const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale.value === 'th' ? 'th-TH' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
}

// ข้อมูลสำหรับวนลูปสร้าง Card (DRY Principle)
const statCards = computed(() => {
    if (!stats.value) return []
    return [
        { key: 'accounts', label: 'dashboard.stats_accounts', value: stats.value.totalAccounts, icon: 'i-heroicons-user-group', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', hoverBorder: 'hover:border-primary-500/50' },
        { key: 'zones', label: 'dashboard.stats_zones', value: stats.value.totalZones, icon: 'i-heroicons-globe-alt', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', hoverBorder: 'hover:border-blue-500/50' },
        { key: 'records', label: 'dashboard.stats_records', value: stats.value.totalRecords, icon: 'i-heroicons-list-bullet', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', hoverBorder: 'hover:border-purple-500/50' },
        { key: 'ddns', label: 'dashboard.stats_ddns', value: stats.value.ddnsEnabledCount, icon: 'i-heroicons-bolt', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', hoverBorder: 'hover:border-emerald-500/50' },
    ]
})
</script>

<template>
    <div>
        <div v-if="!pending && stats" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">

            <UCard v-for="item in statCards" :key="item.key"
                :ui="{ root: 'bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800' }"
                class="shadow-sm transition-all duration-300 group cursor-default" :class="item.hoverBorder">
                <div class="flex flex-col items-center justify-center p-2">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="p-1.5 rounded-md" :class="item.bg">
                            <UIcon :name="item.icon" class="w-4 h-4" :class="item.color" />
                        </div>
                        <span
                            class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                            {{ $t(item.label) }}
                        </span>
                    </div>
                    <p
                        class="text-3xl font-black text-slate-900 dark:text-white group-hover:scale-110 transition-transform duration-300 tracking-tight">
                        {{ item.value }}
                    </p>
                </div>
            </UCard>

            <UCard :ui="{ root: 'bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800' }"
                class="shadow-sm hover:border-amber-500/50 transition-all duration-300 group cursor-default">
                <div class="flex flex-col items-center justify-center p-2">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="p-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10">
                            <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-amber-500" />
                        </div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {{ $t('dashboard.stats_current_ip') }}
                        </span>
                    </div>
                    <p
                        class="text-lg font-mono font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate w-full text-center px-2">
                        {{ stats.currentIp || '-' }}
                    </p>
                </div>
            </UCard>

            <UCard :ui="{ root: 'bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800' }"
                class="shadow-sm hover:border-sky-500/50 transition-all duration-300 group cursor-default">
                <div class="flex flex-col items-center justify-center p-2">
                    <div class="flex items-center gap-2 mb-2.5">
                        <div class="p-1.5 rounded-md bg-sky-50 dark:bg-sky-500/10">
                            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-sky-500" />
                        </div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {{ $t('dashboard.stats_last_update') }}
                        </span>
                    </div>

                    <div v-if="stats.lastUpdate" class="flex flex-col items-center justify-center h-[36px]">
                        <UBadge :color="stats.lastUpdate.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle"
                            size="xs" class="mb-1 uppercase tracking-wider font-bold">
                            {{ stats.lastUpdate.status }}
                        </UBadge>
                        <p class="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            {{ formatTime(stats.lastUpdate.time) }}
                        </p>
                    </div>
                    <div v-else class="flex items-center justify-center h-[36px]">
                        <p class="text-xl font-bold text-slate-400">-</p>
                    </div>
                </div>
            </UCard>

        </div>

        <div v-else-if="pending" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <UCard v-for="i in 6" :key="i"
                :ui="{ root: 'bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800' }"
                class="shadow-sm">
                <div class="flex flex-col items-center justify-center py-2 space-y-4">
                    <USkeleton class="h-4 w-24" />
                    <USkeleton class="h-8 w-16" />
                </div>
            </UCard>
        </div>
    </div>
</template>