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
            <h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-3 font-sans">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-indigo-500" />
                {{ $t('audit.title') }}
            </h1>
            <p class="text-slate-400 mt-1 font-medium font-sans">{{ $t('audit.subtitle') }}</p>
        </div>


        <div
            class="bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl ring-1 ring-slate-800/50">

            <UCard
                class="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 shadow-2xl relative overflow-hidden rounded-2xl ring-1 ring-slate-800/50">
                <template #header>
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">{{
                            $t('audit.title') }}</h2>
                        <div class="flex-none lg:w-48 w-full">
                            <USelect v-model="actionFilter" :items="actionTypes" value-key="value"
                                :placeholder="$t('audit.filter_actions')" :ui="{ base: 'font-sans rounded-xl' }" />
                        </div>
                    </div>
                </template>

                <UTable :data="logs" :columns="columns" :loading="pending" class="overflow-auto relative" :ui="{
                    th: 'sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_1px_0_0_theme(colors.slate.200)] dark:shadow-[0_1px_0_0_theme(colors.slate.800)] text-slate-900 dark:text-slate-100 font-bold whitespace-nowrap'
                }">
                    <template #createdAt-cell="{ row }">
                        <span class="text-sm text-gray-400">{{ formatDate(row.original.createdAt) }}</span>
                    </template>
                    <template #user.username-cell="{ row }">
                        <UBadge color="neutral" variant="subtle">{{ row.original.user?.username || 'System' }}</UBadge>
                    </template>
                    <template #action-cell="{ row }">
                        <UBadge :color="getActionColor(row.original.action)" variant="soft"
                            class="font-bold tracking-wide shadow-sm">
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
    </div>
</template>
