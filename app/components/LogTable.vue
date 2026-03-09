<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { fetchLogs } = useLogs()
const toast = useToast()

const logs = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const pending = ref(true)
const statusFilter = ref('ALL')

import { computed } from 'vue'
const { t } = useI18n()

const columns = computed(() => [
    { id: 'time', header: t('logs.col_time') },
    { id: 'record', header: t('logs.col_record') },
    { id: 'zone', header: t('logs.col_zone') },
    { accessorKey: 'oldIp', header: t('logs.col_old_ip') },
    { accessorKey: 'newIp', header: t('logs.col_new_ip') },
    { id: 'status', header: t('logs.col_status') },
])

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

onMounted(() => loadData())

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
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
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex flex-wrap items-center justify-between">
                <div class="columns-12 lg:columns-6 flex flex-col">
                    <h2 class="text-lg font-semibold">{{ $t('logs.title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('logs.subtitle') }}</p>
                </div>
                <div class="columns-12 lg:columns-6 flex flex-wrap gap-3 lg:w-auto w-full justify-end">
                    <USelect v-model="statusFilter"
                        :items="[{ label: $t('logs.filter_status'), value: 'ALL' }, { label: $t('common.success'), value: 'SUCCESS' }, { label: $t('common.failed'), value: 'FAILED' }]"
                        value-key="value" class="w-36" @update:model-value="onFilterChange" />
                    <UButton icon="i-heroicons-arrow-path" color="neutral" variant="ghost" @click="loadData"
                        :loading="pending" />
                </div>
            </div>
        </template>

        <UTable :data="logs" :columns="columns" :loading="pending" class="overflow-auto relative" :ui="{
            th: 'sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-[0_1px_0_0_theme(colors.gray.200)] dark:shadow-[0_1px_0_0_theme(colors.gray.800)] whitespace-nowrap'
        }">
            <template #time-cell="{ row }">
                <span class="text-sm text-gray-400 whitespace-nowrap">{{ formatDate(row.original.createdAt) }}</span>
            </template>
            <template #record-cell="{ row }">
                <span class="font-mono text-sm">{{ row.original.record?.name || 'N/A' }}</span>
            </template>
            <template #zone-cell="{ row }">
                <UBadge color="neutral" variant="subtle">{{ row.original.record?.zone?.name || 'N/A' }}</UBadge>
            </template>
            <template #status-cell="{ row }">
                <UBadge :color="row.original.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle">
                    {{ row.original.status }}
                </UBadge>
            </template>
        </UTable>

        <!-- Empty State -->
        <div v-if="!pending && logs.length === 0" class="py-8 text-center text-gray-400">
            <p>{{ $t('logs.no_logs') }}</p>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex items-center justify-between pt-4 px-2">
            <span class="text-sm text-gray-400">
                {{ $t('logs.pagination', {
                    page: pagination.page, totalPages: pagination.totalPages, total:
                pagination.total })
                }}
            </span>
            <div class="flex gap-1">
                <UButton size="sm" color="neutral" variant="ghost" :disabled="pagination.page <= 1"
                    @click="goPage(pagination.page - 1)">
                    {{ $t('common.prev') }}
                </UButton>
                <UButton size="sm" color="neutral" variant="ghost" :disabled="pagination.page >= pagination.totalPages"
                    @click="goPage(pagination.page + 1)">
                    {{ $t('common.next') }}
                </UButton>
            </div>
        </div>
    </UCard>
</template>
