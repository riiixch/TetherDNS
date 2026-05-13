<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

const { t } = useI18n()
const toast = useToast()

// State
const logs = ref<any[]>([])
const pending = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const totalPages = ref(1)
const actionFilter = ref('ALL')
const searchQuery = ref('')

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
        if (searchQuery.value) query.search = searchQuery.value

        const res = await $fetch<{ data: any[], pagination: any }>('/api/audit', { query })
        logs.value = res.data
        total.value = res.pagination.total
        totalPages.value = res.pagination.totalPages
    } catch (e: any) {
        toast.add({ title: t('audit.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const goPage = (p: number) => {
    page.value = p
    loadLogs()
}

// Watchers
watch([actionFilter, searchQuery], () => {
    page.value = 1
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

const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ')
}
</script>

<template>
    <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0', footer: 'px-4 py-4' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex flex-col">
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {{ $t('audit.title') }}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {{ $t('audit.subtitle') }}
                    </p>
                </div>
                <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <USelect v-model="actionFilter" :items="actionTypes" value-key="value"
                        :placeholder="$t('audit.filter_actions')" class="w-full sm:w-56"
                        :ui="{ base: 'rounded-xl' }" size="sm" />
                    <UInput v-model="searchQuery" :placeholder="$t('common.search')" icon="i-heroicons-magnifying-glass"
                        size="sm" class="w-full sm:w-64"
                        :ui="{ root: 'rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500' }" />
                    <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft"
                        class="rounded-xl font-bold w-full sm:w-auto justify-center px-4" size="sm" @click="loadLogs"
                        :loading="pending">
                        {{ $t('common.refresh') }}
                    </UButton>
                </div>
            </div>
        </template>

        <!-- Desktop Table View -->
        <div class="hidden lg:block relative min-h-[400px]">
            <UTable :data="logs" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-4 border-b border-slate-200 dark:border-slate-800 lg:text-sm uppercase tracking-wider',
                td: 'py-4 lg:text-base text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #createdAt-cell="{ row }">
                    <span class="text-xs font-medium text-slate-500 tabular-nums">{{ formatDate(row.original.createdAt)
                        }}</span>
                </template>

                <template #user.username-cell="{ row }">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-slate-400" />
                        <span class="font-bold text-slate-900 dark:text-white">{{ row.original.user?.username || 'System'
                            }}</span>
                    </div>
                </template>

                <template #action-cell="{ row }">
                    <UBadge :color="getActionColor(row.original.action)" variant="soft" size="xs"
                        class="font-black uppercase tracking-widest px-2.5 rounded-lg">
                        {{ formatActionText(row.original.action) }}
                    </UBadge>
                </template>

                <template #target-cell="{ row }">
                    <span
                        class="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        {{ row.original.target || '-' }}
                    </span>
                </template>

                <template #details-cell="{ row }">
                    <div v-if="row.original.details" class="truncate max-w-xs text-xs text-slate-500"
                        :title="row.original.details">
                        {{ row.original.details }}
                    </div>
                    <span v-else class="text-slate-400">-</span>
                </template>
            </UTable>

            <div v-if="!pending && logs.length === 0"
                class="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <UIcon name="i-heroicons-document-magnifying-glass" class="w-12 h-12 text-slate-300 mb-3" />
                <p class="text-sm font-medium text-slate-500">{{ $t('common.no_results') }}</p>
            </div>
        </div>

        <!-- Mobile/Tablet Card View -->
        <div class="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 min-h-[400px]">
            <template v-if="pending">
                <div v-for="i in 3" :key="i"
                    class="p-5 bg-white dark:bg-slate-900 rounded-3xl animate-pulse h-48 ring-1 ring-slate-200 dark:ring-slate-800">
                </div>
            </template>
            <template v-else-if="logs.length === 0">
                <div class="py-20 text-center">
                    <UIcon name="i-heroicons-document-magnifying-glass" class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p class="text-base font-bold text-slate-900 dark:text-white">{{ $t('common.no_results') }}</p>
                </div>
            </template>
            <template v-else>
                <div v-for="log in logs" :key="log.id"
                    class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
                    <div class="flex items-start justify-between">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">{{
                                formatDate(log.createdAt) }}</span>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-slate-400" />
                                <h3 class="font-bold text-slate-900 dark:text-white">{{ log.user?.username || 'System' }}
                                </h3>
                            </div>
                        </div>
                        <UBadge :color="getActionColor(log.action)" variant="soft" size="xs" class="font-black rounded-lg">
                            {{ formatActionText(log.action) }}
                        </UBadge>
                    </div>

                    <div
                        class="flex flex-col p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 gap-3">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] uppercase font-black text-slate-400">Target</span>
                            <span
                                class="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{{
                                log.target || '-' }}</span>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <span class="text-[10px] uppercase font-black text-slate-400">Details</span>
                            <p class="text-xs text-slate-500 leading-relaxed">{{ log.details || '-' }}</p>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <template #footer v-if="totalPages > 1 || page > 1">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
                <span class="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {{ $t('common.showing_results', {
                        start: (page - 1) * limit + 1,
                        end: Math.min(page * limit, total),
                        total: total
                    }) }}
                </span>
                <div class="flex items-center gap-1.5">
                    <UButton size="sm" color="neutral" variant="soft" class="rounded-xl font-bold px-4"
                        icon="i-heroicons-chevron-left" :disabled="page <= 1" @click="goPage(page - 1)">
                        {{ $t('common.prev') }}
                    </UButton>
                    <div
                        class="w-10 h-8 flex items-center justify-center text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        {{ page }}
                    </div>
                    <UButton size="sm" color="neutral" variant="soft" class="rounded-xl font-bold px-4"
                        icon="i-heroicons-chevron-right" :disabled="page >= totalPages" @click="goPage(page + 1)">
                        {{ $t('common.next') }}
                    </UButton>
                </div>
            </div>
        </template>
    </UCard>
</template>
