<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const { fetchLogs } = useLogs()
const toast = useToast()
const { t } = useI18n()

// State
const logs = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const pending = ref(true)
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
        })
        logs.value = res.data
        pagination.value = res.pagination
    } catch (e: any) {
        toast.add({ title: t('logs.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

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
    <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0', footer: 'px-4 py-4 sm:px-6' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex flex-col">
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{ $t('logs.title') }}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{{ $t('logs.subtitle') }}
                    </p>
                </div>

                <div class="flex flex-row items-center gap-2.5 w-full md:w-auto justify-end">
                    <USelect v-model="statusFilter" :items="filterOptions" value-key="value" class="w-full sm:w-40"
                        :ui="{ base: 'rounded-xl' }" @update:model-value="onFilterChange" />
                    <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft"
                        class="rounded-xl shadow-sm shrink-0" @click="loadData" :loading="pending" />
                </div>
            </div>
        </template>

        <div class="overflow-x-auto min-h-[300px] relative">
            <UTable :data="logs" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10',
                td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #time-cell="{ row }">
                    <span class="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{{
                        formatDate(row.original.createdAt) }}</span>
                </template>

                <template #record-cell="{ row }">
                    <span class="font-semibold text-slate-900 dark:text-white">{{ row.original.record?.name || 'N/A'
                    }}</span>
                </template>

                <template #zone-cell="{ row }">
                    <UBadge color="neutral" variant="soft" size="xs">
                        {{ row.original.record?.zone?.name || 'N/A' }}
                    </UBadge>
                </template>

                <template #oldIp-cell="{ row }">
                    <span class="font-mono text-xs text-slate-400 line-through tracking-tight">{{ row.original.oldIp ||
                        '-' }}</span>
                </template>

                <template #newIp-cell="{ row }">
                    <span class="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">{{
                        row.original.newIp || '-' }}</span>
                </template>

                <template #status-cell="{ row }">
                    <UBadge :color="row.original.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle" size="xs"
                        class="font-bold uppercase tracking-wider">
                        {{ row.original.status }}
                    </UBadge>
                </template>
            </UTable>

            <div v-if="!pending && logs.length === 0"
                class="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900">
                <div
                    class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 text-slate-400" />
                </div>
                <p class="text-sm font-medium text-slate-500">{{ $t('logs.no_logs') }}</p>
            </div>
        </div>

        <template #footer v-if="pagination.totalPages > 1 || pagination.page > 1">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span class="text-xs font-medium text-slate-500">
                    {{ $t('logs.pagination', {
                        page: pagination.page,
                        totalPages: pagination.totalPages,
                        total: pagination.total
                    }) }}
                </span>
                <div class="flex items-center gap-1.5">
                    <UButton size="xs" color="neutral" variant="soft" class="rounded-lg" icon="i-heroicons-chevron-left"
                        :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">
                        {{ $t('common.prev') }}
                    </UButton>
                    <div class="px-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {{ pagination.page }}
                    </div>
                    <UButton size="xs" color="neutral" variant="soft" class="rounded-lg"
                        trailing-icon="i-heroicons-chevron-right" :disabled="pagination.page >= pagination.totalPages"
                        @click="goPage(pagination.page + 1)">
                        {{ $t('common.next') }}
                    </UButton>
                </div>
            </div>
        </template>
    </UCard>
</template>