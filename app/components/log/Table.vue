<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const { fetchLogs } = useLogs()
const toast = useToast()
const { t } = useI18n()

// State
const logs = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const pending = ref(true)
const searchQuery = ref('')
const statusFilter = ref('ALL')

// Computed
const columns = computed(() => [
    { id: 'time', header: t('logs.col_time') },
    { id: 'record', header: t('logs.col_record') },
    { id: 'zone', header: t('logs.col_zone') },
    { accessorKey: 'oldIp', header: t('logs.col_old_ip') },
    { accessorKey: 'newIp', header: t('logs.col_new_ip') },
    { id: 'status', header: t('logs.col_status') },
])

const filterOptions = computed(() => [
    { label: t('logs.filter_status'), value: 'ALL' },
    { label: t('common.success'), value: 'SUCCESS' },
    { label: t('common.failed'), value: 'FAILED' }
])

// Actions
const loadData = async () => {
    pending.value = true
    try {
        const res = await fetchLogs({
            page: pagination.value.page,
            limit: pagination.value.limit,
            status: statusFilter.value === 'ALL' ? undefined : (statusFilter.value || undefined),
            search: searchQuery.value || undefined
        })
        logs.value = res.data
        pagination.value = res.pagination
    } catch (e: any) {
        toast.add({ title: t('logs.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

// Watchers
watch([searchQuery, statusFilter], () => {
    pagination.value.page = 1
    loadData()
})

const { locale } = useI18n()

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale.value === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
}

const goPage = (p: number) => {
    pagination.value.page = p
    loadData()
}

const onFilterChange = () => {
    pagination.value.page = 1
    loadData()
}

onMounted(() => loadData())
</script>

<template>
    <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0', footer: 'px-4 py-4' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex flex-col">
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {{ $t('logs.title') }}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {{ $t('logs.subtitle') }}
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <!-- Status Filter -->
                    <USelect v-model="statusFilter" :items="[
                        { label: 'All Status', value: 'ALL' },
                        { label: 'Success', value: 'SUCCESS' },
                        { label: 'Error', value: 'ERROR' }
                    ]" class="w-full sm:w-36" :ui="{ base: 'rounded-xl' }" size="sm" />

                    <!-- Search Bar -->
                    <UInput v-model="searchQuery" :placeholder="$t('common.search')" icon="i-heroicons-magnifying-glass"
                        size="sm" class="w-full sm:w-64"
                        :ui="{ root: 'rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500' }" />
                    
                    <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft"
                        class="rounded-xl font-bold w-full sm:w-auto justify-center px-4" size="sm" :loading="pending" @click="loadData">
                        {{ $t('common.refresh') }}
                    </UButton>
                </div>
            </div>
        </template>

        <!-- Desktop Table View (lg and up) -->
        <div class="hidden lg:block relative min-h-[400px]">
            <UTable :data="logs" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-4 border-b border-slate-200 dark:border-slate-800 lg:text-sm uppercase tracking-wider',
                td: 'py-4 lg:text-base text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #time-cell="{ row }">
                    <span class="font-medium text-slate-500 tabular-nums">{{ formatDate(row.original.createdAt) }}</span>
                </template>

                <template #zone-cell="{ row }">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-blue-500" />
                        <span class="font-bold text-slate-900 dark:text-white">{{ row.original.record?.zone?.name || 'N/A' }}</span>
                    </div>
                </template>

                <template #record-cell="{ row }">
                    <span class="font-mono text-sm px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        {{ row.original.record?.name || 'N/A' }}
                    </span>
                </template>

                <template #status-cell="{ row }">
                    <UBadge :color="row.original.status === 'SUCCESS' ? 'success' : 'error'" variant="soft" size="xs"
                        class="font-black uppercase tracking-widest px-2.5 rounded-lg">
                        {{ row.original.status }}
                    </UBadge>
                </template>
            </UTable>
        </div>

        <!-- Mobile/Tablet Card View (below lg) -->
        <div class="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 min-h-[400px]">
            <template v-if="pending">
                <div v-for="i in 3" :key="i" class="p-5 bg-white dark:bg-slate-900 rounded-3xl animate-pulse h-40 ring-1 ring-slate-200 dark:ring-slate-800"></div>
            </template>
            <template v-else-if="logs.length === 0">
                <div class="py-20 text-center">
                    <UIcon name="i-heroicons-document-magnifying-glass" class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p class="text-base font-bold text-slate-900 dark:text-white">{{ $t('logs.no_logs') }}</p>
                </div>
            </template>
            <template v-else>
                <div v-for="log in logs" :key="log.id"
                    class="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                    <div class="flex items-start justify-between">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">{{ formatDate(log.createdAt) }}</span>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-blue-500" />
                                <h3 class="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{{ log.record?.zone?.name || 'N/A' }}</h3>
                            </div>
                        </div>
                        <UBadge :color="log.status === 'SUCCESS' ? 'success' : 'error'" variant="soft" size="xs" class="font-black rounded-lg">
                            {{ log.status }}
                        </UBadge>
                    </div>

                    <div class="flex flex-col p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 gap-3">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] uppercase font-black text-slate-400">Record</span>
                            <span class="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{{ log.record?.name || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] uppercase font-black text-slate-400">Update Content</span>
                            <span class="font-mono text-xs font-bold text-primary-500">{{ log.newIp || '-' }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <template #footer v-if="pagination.totalPages > 1 || pagination.page > 1">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span class="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {{ $t('logs.pagination', {
                        page: pagination.page,
                        totalPages: pagination.totalPages,
                        total: pagination.total
                    }) }}
                </span>
                <div class="flex items-center gap-1.5">
                    <UButton size="sm" color="neutral" variant="soft" class="rounded-xl font-bold px-4" icon="i-heroicons-chevron-left"
                        :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">
                        {{ $t('common.prev') }}
                    </UButton>
                    <div class="w-10 h-8 flex items-center justify-center text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        {{ pagination.page }}
                    </div>
                    <UButton size="sm" color="neutral" variant="soft" class="rounded-xl font-bold px-4" icon="i-heroicons-chevron-right"
                        :disabled="pagination.page >= pagination.totalPages" @click="goPage(pagination.page + 1)">
                        {{ $t('common.next') }}
                    </UButton>
                </div>
            </div>
        </template>
    </UCard>
</template>