<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'default' })

const logs = ref<any[]>([])
const pending = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const actionFilter = ref('ALL')
const toast = useToast()

import { computed } from 'vue'

const { t } = useI18n()

const columns = computed(() => [
    { accessorKey: 'createdAt', header: t('audit.col_time') },
    { accessorKey: 'user.username', header: t('audit.col_user') },
    { accessorKey: 'action', header: t('audit.col_action') },
    { accessorKey: 'target', header: t('audit.col_target') },
    { id: 'details', header: t('audit.col_details') }
])

const actionTypes = computed(() => [
    { label: t('audit.filter_actions'), value: 'ALL' },
    { label: t('audit.action_create_record'), value: 'CREATE_RECORD' },
    { label: t('audit.action_update_record'), value: 'UPDATE_RECORD' },
    { label: t('audit.action_delete_record'), value: 'DELETE_RECORD' },
    { label: t('audit.action_add_zone'), value: 'ADD_ZONE' },
    { label: t('audit.action_delete_zone'), value: 'DELETE_ZONE' },
])

const loadLogs = async () => {
    pending.value = true
    try {
        const query: any = { page: page.value, limit: limit.value }
        if (actionFilter.value && actionFilter.value !== 'ALL') query.action = actionFilter.value

        const res = await $fetch<{ data: any[], pagination: any }>('/api/audit', { query })
        logs.value = res.data
        total.value = res.pagination.total
    } catch (e: any) {
        toast.add({ title: t('audit.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

onMounted(() => loadLogs())

watch([page, actionFilter], () => {
    loadLogs()
})

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH')
}

const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'success'
    if (action.includes('UPDATE')) return 'warning'
    if (action.includes('DELETE')) return 'error'
    return 'neutral'
}
</script>

<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold">{{ $t('audit.title') }}</h1>
            <p class="text-gray-400 mt-1">{{ $t('audit.subtitle') }}</p>
        </div>

        <UCard>
            <template #header>
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-semibold">{{ $t('audit.title') }}</h2>
                    <div class="">
                        <USelect v-model="actionFilter" :items="actionTypes" value-key="value"
                            :placeholder="$t('audit.filter_actions')" />
                    </div>
                </div>
            </template>

            <UTable :data="logs" :columns="columns" :loading="pending" class="overflow-auto relative" :ui="{
                th: 'sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-[0_1px_0_0_theme(colors.gray.200)] dark:shadow-[0_1px_0_0_theme(colors.gray.800)] whitespace-nowrap'
            }">
                <template #createdAt-cell="{ row }">
                    <span class="text-sm text-gray-400">{{ formatDate(row.original.createdAt) }}</span>
                </template>
                <template #user.username-cell="{ row }">
                    <UBadge color="neutral" variant="subtle">{{ row.original.user?.username || 'System' }}</UBadge>
                </template>
                <template #action-cell="{ row }">
                    <UBadge :color="getActionColor(row.original.action)" variant="subtle">
                        {{ row.original.action }}
                    </UBadge>
                </template>
                <template #details-cell="{ row }">
                    <div v-if="row.original.details" class="truncate max-w-xs text-xs text-gray-500"
                        :title="row.original.details">
                        {{ row.original.details }}
                    </div>
                    <span v-else class="text-gray-600">-</span>
                </template>
            </UTable>

            <div v-if="total > limit" class="mt-4 flex justify-between items-center">
                <span class="text-sm text-gray-400">{{ $t('common.showing_results', {
                    start: (page - 1) * limit + 1,
                    end:
                        Math.min(page * limit, total), total: total
                }) }}</span>
                <UPagination v-model:page="page" :total="total" :items-per-page="limit" show-edges />
            </div>
        </UCard>
    </div>
</template>
