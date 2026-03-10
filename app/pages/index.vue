<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({ title: `Dashboard` })

definePageMeta({ layout: 'default' })

const { fetchLogs } = useLogs()
const recentLogs = ref<any[]>([])
const pendingLogs = ref(true)

const loadRecentLogs = async () => {
    pendingLogs.value = true
    try {
        const res = await fetchLogs({ page: 1, limit: 5 })
        recentLogs.value = res.data
    } catch (e) {
        console.error('Failed to load recent logs', e)
    } finally {
        pendingLogs.value = false
    }
}

const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' mins ago'
    return Math.floor(seconds) + ' seconds ago'
}

onMounted(() => {
    loadRecentLogs()
})
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1
                    class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                        <UIcon name="i-heroicons-squares-2x2-solid" class="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                    </div>
                    {{ $t('dashboard.title') }}
                </h1>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {{ $t('dashboard.subtitle') }}
                </p>
            </div>
        </div>

        <ClientOnly>
            <DashboardStats />
        </ClientOnly>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div class="col-span-1 lg:col-span-8 flex flex-col h-full">
                <ClientOnly>
                    <AnalyticsIpChangeChart class="h-full min-h-[400px]" />
                </ClientOnly>
            </div>

            <div class="col-span-1 lg:col-span-4 space-y-6 flex flex-col h-full">

                <UCard class="bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm flex-1">
                    <div class="mb-5 flex items-center justify-between">
                        <h3
                            class="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-slate-400" />
                            Recent Updates
                        </h3>
                        <UButton to="/logs" color="neutral" variant="ghost" size="xs"
                            class="text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10">
                            View All
                        </UButton>
                    </div>

                    <div class="space-y-4">
                        <template v-if="pendingLogs">
                            <div class="flex justify-center p-4">
                                <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-slate-400" />
                            </div>
                        </template>
                        <template v-else-if="recentLogs.length === 0">
                            <div class="text-center p-4">
                                <p class="text-sm font-medium text-slate-500">{{ $t('logs.no_logs') }}</p>
                            </div>
                        </template>
                        <template v-else>
                            <div v-for="log in recentLogs" :key="log.id" class="relative pl-4 border-l-2"
                                :class="log.status === 'SUCCESS' ? 'border-emerald-500/30' : 'border-red-500/30'">
                                <div class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white dark:ring-slate-900"
                                    :class="log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'">
                                </div>
                                <div class="flex items-start justify-between gap-2">
                                    <div v-if="log.status === 'SUCCESS'">
                                        <p class="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                                            {{ log.record?.name || 'Unknown' }}</p>
                                        <div class="flex items-center gap-1.5 mt-1.5">
                                            <span class="text-[11px] font-mono text-slate-400 line-through">{{ log.oldIp
                                                || '-' }}</span>
                                            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-slate-300" />
                                            <span
                                                class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{{
                                                    log.newIp || '-' }}</span>
                                        </div>
                                    </div>
                                    <div v-else>
                                        <p class="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                                            {{ log.record?.name || 'Unknown' }}</p>
                                        <p
                                            class="text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium line-clamp-1 py-[2px]">
                                            {{ log.message || 'Update Failed' }}</p>
                                    </div>
                                    <span class="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{{
                                        timeAgo(log.createdAt) }}</span>
                                </div>
                            </div>
                        </template>
                    </div>
                </UCard>

                <div
                    class="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 to-blue-700 p-6 sm:p-8 shadow-lg shadow-primary-500/20 group border border-primary-500/20 shrink-0">
                    <div
                        class="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
                        <UIcon name="i-heroicons-rocket-launch-solid" class="w-48 h-48 text-white" />
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-white mb-2 tracking-tight">{{ $t('dashboard.scale_title') }}
                        </h3>
                        <p class="text-sm text-primary-100 mb-6 leading-relaxed max-w-[90%]">
                            {{ $t('dashboard.scale_desc') }}
                        </p>
                        <UButton color="neutral" variant="solid" size="md" block
                            class="bg-white rounded-xl font-bold text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
                            @click="$router.push('/settings')">
                            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 mr-1" />
                            {{ $t('dashboard.btn_global_settings') }}
                        </UButton>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>