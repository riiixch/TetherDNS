<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

const { t } = useI18n()
useHead({ title: t('audit.title') })

definePageMeta({ layout: 'default' })

const toast = useToast()

// State
const logs = ref<any[]>([])
const pending = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const actionFilter = ref('ALL')

// Computed
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

// Actions
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

// Watchers
// แยกระหว่างการเปลี่ยน Filter (ต้องกลับไปหน้า 1 เสมอ) กับเปลี่ยนหน้า
watch(actionFilter, () => {
    page.value = 1
    loadLogs()
})

watch(page, () => {
    loadLogs()
})

onMounted(() => loadLogs())

// Helpers
const { locale } = useI18n()

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(locale.value === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
}

const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'success'
    if (action.includes('UPDATE')) return 'warning'
    if (action.includes('DELETE')) return 'error'
    return 'neutral'
}

// ทำให้ข้อความ Action ดูสวยขึ้น เช่น "CREATE_RECORD" -> "CREATE RECORD"
const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ')
}
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1
                    class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                        <UIcon name="i-heroicons-clipboard-document-list-solid"
                            class="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
                    </div>
                    {{ $t('audit.title') }}
                </h1>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {{ $t('audit.subtitle') }}
                </p>
            </div>
        </div>

        <div class="w-full">
            <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0', footer: 'px-4 py-4 sm:px-6' }"
                class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <template #header>
                    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div class="flex flex-col">
                            <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{
                                $t('audit.title') }}</h2>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                {{ $t('audit.subtitle') }}
                            </p>
                        </div>
                        <div class="flex flex-row items-center gap-2.5 w-full md:w-auto justify-end">
                            <USelect v-model="actionFilter" :items="actionTypes" value-key="value"
                                :placeholder="$t('audit.filter_actions')" class="w-full sm:w-48"
                                :ui="{ base: 'rounded-xl' }" />
                            <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft"
                                class="rounded-xl shadow-sm shrink-0" @click="loadLogs" :loading="pending" />
                        </div>
                    </div>
                </template>

                <div class="overflow-x-auto min-h-[300px] relative">
                    <UTable :data="logs" :columns="columns" :loading="pending" :ui="{
                        th: 'sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800',
                        td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                        tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
                    }">
                        <template #createdAt-cell="{ row }">
                            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{{
                                formatDate(row.original.createdAt) }}</span>
                        </template>

                        <template #user.username-cell="{ row }">
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-slate-400" />
                                <span class="font-semibold text-slate-900 dark:text-white">{{
                                    row.original.user?.username || 'System' }}</span>
                            </div>
                        </template>

                        <template #action-cell="{ row }">
                            <UBadge :color="getActionColor(row.original.action)" variant="subtle" size="xs"
                                class="font-bold uppercase tracking-wider">
                                {{ formatActionText(row.original.action) }}
                            </UBadge>
                        </template>

                        <template #target-cell="{ row }">
                            <span
                                class="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                {{ row.original.target || '-' }}
                            </span>
                        </template>

                        <template #details-cell="{ row }">
                            <div v-if="row.original.details"
                                class="truncate max-w-[200px] sm:max-w-xs text-xs text-slate-500 dark:text-slate-400"
                                :title="row.original.details">
                                {{ row.original.details }}
                            </div>
                            <span v-else class="text-slate-400">-</span>
                        </template>
                    </UTable>

                    <div v-if="!pending && logs.length === 0"
                        class="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900">
                        <div
                            class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 text-slate-400" />
                        </div>
                        <p class="text-sm font-medium text-slate-500">{{ $t('common.no_results') }}</p>
                    </div>
                </div>

                <template #footer v-if="total > limit">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span class="text-xs font-medium text-slate-500">
                            {{ $t('common.showing_results', {
                                start: (page - 1) * limit + 1,
                                end: Math.min(page * limit, total),
                                total: total
                            }) }}
                        </span>

                        <UPagination v-model="page" :total="total" :items-per-page="limit" show-edges />
                    </div>
                </template>
            </UCard>
        </div>
    </div>
</template>