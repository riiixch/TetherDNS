<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

useHead({ title: `DNS Zones` })

definePageMeta({ layout: 'default' })

const route = useRoute()
const cfZoneId = route.params.id as string
const toast = useToast()
const { t } = useI18n()
const { fetchRecords, toggleAutoUpdate, updateRecord, deleteRecord } = useRecords()

// State
const records = ref<any[]>([])
const zoneName = ref('')
const pending = ref(true)
const searchQuery = ref('')

// Computed
const filteredRecords = computed(() => {
    if (!searchQuery.value) return records.value
    const q = searchQuery.value.toLowerCase()
    return records.value.filter((r: any) =>
        r.name.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    )
})

const columns = computed(() => [
    { accessorKey: 'type', header: t('records.col_type') },
    { accessorKey: 'name', header: t('records.col_name') },
    { accessorKey: 'content', header: t('records.col_content') },
    { id: 'proxied', header: t('records.col_proxied') },
    { id: 'autoUpdate', header: t('records.col_ddns') },
    { id: 'actions', header: t('records.col_actions') },
])

// Modals State
const isAddModalOpen = ref(false)
const editingRecord = ref<any>(null)

// DDNS warning modal
const ddnsWarningOpen = ref(false)
const ddnsWarningRecord = ref<any>(null)

// Delete confirm modal
const deleteRecordModalOpen = ref(false)
const deletingRecord = ref<any>(null)
const deleteRecordLoading = ref(false)

// Propagation Check Modal
const propagationModalOpen = ref(false)
const propagationRecord = ref<any>(null)
const propagationResults = ref<any>(null)
const propagationLoading = ref(false)

// IP History Modal
const historyModalOpen = ref(false)
const historyRecord = ref<any>(null)
const historyLogs = ref<any[]>([])
const historyLoading = ref(false)

// Actions
const loadData = async () => {
    pending.value = true
    try {
        const data = await fetchRecords(cfZoneId)
        records.value = data
        if (data.length > 0 && data[0].zone) {
            zoneName.value = data[0].zone.name

            useHead({ title: `${zoneName.value} Zones` })
        }
    } catch (e: any) {
        toast.add({ title: 'Error loading records', description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const handleToggle = async (record: any) => {
    const newValue = !record.isAutoUpdate

    if (newValue && record.type !== 'A' && record.type !== 'AAAA') {
        ddnsWarningRecord.value = record
        ddnsWarningOpen.value = true
        return
    }

    await doToggle(record, newValue)
}

const doToggle = async (record: any, newValue: boolean) => {
    try {
        await toggleAutoUpdate(record.id, newValue)
        record.isAutoUpdate = newValue
        toast.add({
            title: newValue ? 'DDNS Enabled' : 'DDNS Disabled',
            description: `Auto-update for ${record.name} is now ${newValue ? 'enabled' : 'disabled'}.`,
            color: 'success'
        })
    } catch (e: any) {
        toast.add({ title: 'Toggle failed', description: e.message, color: 'error' })
    }
}

const confirmDdnsWarning = async () => {
    if (!ddnsWarningRecord.value) return

    try {
        const ipRes = await $fetch<{ ip: string }>('https://api.ipify.org?format=json')
        const currentIp = ipRes?.ip

        if (!currentIp) {
            toast.add({ title: 'Error', description: 'Failed to fetch current IP address.', color: 'error' })
            return
        }

        await updateRecord(ddnsWarningRecord.value.id, {
            type: 'A',
            content: currentIp,
            isAutoUpdate: true,
        })
        ddnsWarningRecord.value.type = 'A'
        ddnsWarningRecord.value.content = currentIp
        ddnsWarningRecord.value.isAutoUpdate = true
        toast.add({
            title: 'DDNS Enabled',
            description: `Record ${ddnsWarningRecord.value.name} changed to A (${currentIp}) with auto-update enabled.`,
            color: 'success'
        })
    } catch (e: any) {
        toast.add({ title: 'Failed', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        ddnsWarningOpen.value = false
        ddnsWarningRecord.value = null
    }
}

const cancelDdnsWarning = () => {
    ddnsWarningOpen.value = false
    ddnsWarningRecord.value = null
}

const openDeleteModal = (record: any) => {
    deletingRecord.value = record
    deleteRecordModalOpen.value = true
}

const executeDeleteRecord = async () => {
    if (!deletingRecord.value) return
    deleteRecordLoading.value = true
    try {
        await deleteRecord(deletingRecord.value.id)
        toast.add({ title: 'Deleted', description: `Record ${deletingRecord.value.name} deleted.`, color: 'success' })
        loadData()
    } catch (e: any) {
        toast.add({ title: 'Delete Failed', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        deleteRecordLoading.value = false
        deleteRecordModalOpen.value = false
        deletingRecord.value = null
    }
}

const openEdit = (record: any) => {
    editingRecord.value = { ...record }
}

const checkPropagation = async (record: any) => {
    propagationRecord.value = record
    propagationModalOpen.value = true
    propagationLoading.value = true
    propagationResults.value = null
    try {
        const res = await $fetch<any>(`/api/records/${record.id}/propagate`)
        propagationResults.value = res
    } catch (e: any) {
        toast.add({ title: 'Propagation Check Failed', description: e.data?.statusMessage || e.message, color: 'error' })
        propagationModalOpen.value = false
    } finally {
        propagationLoading.value = false
    }
}

const openHistory = async (record: any) => {
    historyRecord.value = record
    historyModalOpen.value = true
    historyLoading.value = true
    historyLogs.value = []
    try {
        const res = await $fetch<{ data: any[] }>(`/api/records/${record.id}/history`)
        historyLogs.value = res.data
    } catch (e: any) {
        toast.add({ title: 'Failed to load history', description: e.data?.statusMessage || e.message, color: 'error' })
        historyModalOpen.value = false
    } finally {
        historyLoading.value = false
    }
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('th-TH')

onMounted(() => loadData())
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">

        <div class="flex items-center gap-4">
            <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" to="/zones"
                class="rounded-xl shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800" />
            <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl hidden sm:block">
                    <UIcon name="i-heroicons-server-stack-solid" class="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                </div>
                <div>
                    <h1 class="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {{ zoneName || 'DNS Records' }}
                    </h1>
                    <div class="flex items-center gap-2 mt-0.5">
                        <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">{{ cfZoneId }}</UBadge>
                    </div>
                </div>
            </div>
        </div>

        <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0' }"
            class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
            <template #header>
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                        <div class="flex flex-col">
                            <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{
                                $t('records.title') }}</h2>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{{
                                $t('records.subtitle') }}</p>
                        </div>

                        <div class="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                        <UInput v-model="searchQuery" :placeholder="$t('records.search_placeholder')"
                            icon="i-heroicons-magnifying-glass" class="w-full sm:max-w-xs"
                            :ui="{ root: 'rounded-xl transition-colors focus-within:ring-primary-500' }" />
                    </div>
                    <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                        <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft"
                            class="rounded-xl font-semibold shadow-sm" :loading="pending" @click="loadData">
                            <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
                        </UButton>
                        <UButton icon="i-heroicons-plus" color="primary" variant="solid"
                            class="rounded-xl font-bold shadow-sm" @click="isAddModalOpen = true">
                            {{ $t('records.add_record') }}
                        </UButton>
                    </div>
                </div>

                <div class="sm:hidden mt-4">
                    <UInput v-model="searchQuery" :placeholder="$t('records.search_placeholder')"
                        icon="i-heroicons-magnifying-glass" class="w-full" :ui="{ root: 'rounded-xl' }" />
                </div>
            </template>

            <div class="overflow-x-auto relative min-h-[300px]">
                <UTable :data="filteredRecords" :columns="columns" :loading="pending" :ui="{
                    th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10',
                    td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                    tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
                }">
                    <template #type-cell="{ row }">
                        <UBadge
                            :color="row.original.type === 'A' ? 'primary' : row.original.type === 'AAAA' ? 'info' : 'neutral'"
                            variant="subtle" class="font-bold">
                            {{ row.original.type }}
                        </UBadge>
                    </template>
                    <template #content-cell="{ row }">
                        <div class="max-w-[20ch] sm:max-w-[40ch] truncate text-slate-900 dark:text-white font-mono text-xs"
                            :title="row.original.content">
                            {{ row.original.content }}
                        </div>
                    </template>
                    <template #proxied-cell="{ row }">
                        <UBadge :color="row.original.proxied ? 'warning' : 'neutral'" variant="subtle" size="xs">
                            {{ row.original.proxied ? 'Proxied' : 'DNS Only' }}
                        </UBadge>
                    </template>
                    <template #autoUpdate-cell="{ row }">
                        <USwitch :model-value="row.original.isAutoUpdate"
                            @update:model-value="handleToggle(row.original)" color="primary" />
                    </template>
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end gap-1.5">
                            <UButton v-if="row.original.type === 'A' || row.original.type === 'AAAA'" size="xs"
                                color="neutral" variant="ghost" icon="i-heroicons-clock" title="View IP History"
                                class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                @click="openHistory(row.original)" />
                            <UButton v-if="row.original.type === 'A' || row.original.type === 'AAAA'" size="xs"
                                color="info" variant="ghost" icon="i-heroicons-globe-alt" title="Check DNS Propagation"
                                class="rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                @click="checkPropagation(row.original)" />
                            <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-pencil-square"
                                class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                @click="openEdit(row.original)" />
                            <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
                                class="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                @click="openDeleteModal(row.original)" />
                        </div>
                    </template>
                </UTable>

                <div v-if="!pending && records.length === 0"
                    class="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900">
                    <div
                        class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <UIcon name="i-heroicons-list-bullet" class="w-8 h-8 text-slate-400" />
                    </div>
                    <p class="text-sm font-medium text-slate-500">No A, AAAA, or CNAME records found for this zone.</p>
                </div>
            </div>
        </UCard>

        <RecordAddModal v-if="isAddModalOpen" :cf-zone-id="cfZoneId" @close="isAddModalOpen = false"
            @refresh="loadData" />
        <RecordEditModal v-if="editingRecord" :record="editingRecord" @close="editingRecord = null"
            @refresh="loadData" />

        <UModal v-model:open="deleteRecordModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard
                    :ui="{ header: 'border-b border-slate-200 dark:border-slate-800', footer: 'border-t border-slate-200 dark:border-slate-800' }"
                    class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('common.delete') }}
                                Record</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="deleteRecordModalOpen = false" />
                        </div>
                    </template>
                    <div class="py-2 space-y-4">
                        <div
                            class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4">
                            <div class="flex gap-3">
                                <UIcon name="i-heroicons-exclamation-circle"
                                    class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 class="text-sm font-bold text-red-800 dark:text-red-400">
                                        {{ $t('common.are_you_sure') }}
                                    </h4>
                                    <p class="text-xs text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                                        {{ $t('records.delete_confirm', { name: deletingRecord?.name }) }}
                                    </p>
                                    <p class="text-[11px] text-red-500/80 dark:text-red-400/80 mt-1">{{
                                        $t('records.delete_warning') }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" class="rounded-xl"
                                @click="deleteRecordModalOpen = false">{{ $t('common.cancel') }}</UButton>
                            <UButton color="error" variant="solid" class="rounded-xl shadow-sm"
                                :loading="deleteRecordLoading" @click="executeDeleteRecord">{{ $t('common.delete') }}
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <UModal v-model:open="propagationModalOpen" :ui="{ content: 'sm:max-w-xl' }">
            <template #content>
                <UCard
                    :ui="{ header: 'border-b border-slate-200 dark:border-slate-800', footer: 'border-t border-slate-200 dark:border-slate-800', body: 'p-0 sm:p-0' }"
                    class="ring-0 overflow-hidden">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                    $t('propagation.title') }}</h3>
                                <p class="text-xs text-slate-500">{{ $t('propagation.desc', {
                                    name:
                                        propagationRecord?.name
                                }) }}</p>
                            </div>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="propagationModalOpen = false" />
                        </div>
                    </template>

                    <div class="p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
                        <div v-if="propagationLoading"
                            class="flex flex-col items-center justify-center py-10 space-y-4 relative overflow-hidden">
                            <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 text-primary-500 animate-spin" />
                            <p class="text-sm font-medium text-slate-500">{{ $t('propagation.querying') }}</p>
                            <div class="absolute inset-0 bg-primary-500/5 rounded-full blur-3xl animate-pulse -z-10">
                            </div>
                        </div>

                        <div v-else-if="propagationResults" class="space-y-5">
                            <div class="flex items-center justify-between p-4 rounded-xl border"
                                :class="propagationResults.fullyPropagated ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'">
                                <div>
                                    <h3 class="font-bold text-sm sm:text-base"
                                        :class="propagationResults.fullyPropagated ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
                                        {{ propagationResults.fullyPropagated ? $t('propagation.fully_propagated') :
                                            $t('propagation.in_progress') }}
                                    </h3>
                                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {{ $t('propagation.expected_ip') }} <strong
                                            class="font-mono text-slate-900 dark:text-slate-200">{{
                                                propagationResults.expected
                                            }}</strong>
                                    </p>
                                </div>
                                <UIcon
                                    :name="propagationResults.fullyPropagated ? 'i-heroicons-check-circle-solid' : 'i-heroicons-clock-solid'"
                                    class="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                                    :class="propagationResults.fullyPropagated ? 'text-emerald-500' : 'text-amber-500'" />
                            </div>

                            <div class="space-y-3">
                                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">{{
                                    $t('propagation.resolver_status') }}</h4>
                                <div class="grid gap-2 max-h-60 overflow-y-auto pr-2">
                                    <div v-for="res in propagationResults.results" :key="res.resolver"
                                        class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                                        <div class="flex items-center gap-3">
                                            <UIcon
                                                :name="res.propagated ? 'i-heroicons-check-circle-solid' : 'i-heroicons-x-circle-solid'"
                                                class="w-5 h-5 shrink-0"
                                                :class="res.propagated ? 'text-emerald-500' : 'text-red-500'" />
                                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{
                                                res.resolver
                                                }}</span>
                                        </div>
                                        <div class="text-right flex flex-col items-end">
                                            <span class="text-xs font-mono font-medium"
                                                :class="res.propagated ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                                                {{ res.resolved?.length ? res.resolved.join(', ') :
                                                    $t('propagation.not_found') }}
                                            </span>
                                            <span v-if="res.error"
                                                class="text-[10px] text-red-500 mt-0.5 line-clamp-1 max-w-[150px]"
                                                :title="res.error">{{ res.error }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" class="rounded-xl"
                                @click="propagationModalOpen = false">{{ $t('common.close') }}</UButton>
                            <UButton v-if="propagationResults && !propagationResults.fullyPropagated"
                                icon="i-heroicons-arrow-path" color="primary" variant="soft" class="rounded-xl"
                                @click="checkPropagation(propagationRecord)">
                                {{ $t('common.refresh') }}
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <UModal v-model:open="ddnsWarningOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard
                    :ui="{ header: 'border-b border-slate-200 dark:border-slate-800', footer: 'border-t border-slate-200 dark:border-slate-800' }"
                    class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('ddns_warning.title')
                                }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="cancelDdnsWarning" />
                        </div>
                    </template>
                    <div class="py-2 space-y-4">
                        <div
                            class="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                            <div class="flex gap-3">
                                <UIcon name="i-heroicons-exclamation-triangle"
                                    class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 class="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">
                                        {{ $t('ddns_warning.subtitle') }}
                                    </h4>
                                    <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                        {{ $t('ddns_warning.desc1') }}
                                    </p>
                                    <p class="text-[11px] font-medium text-amber-600 dark:text-amber-400/80 mt-2">
                                        {{ $t('ddns_warning.desc2', {
                                            name: ddnsWarningRecord?.name, type:
                                                ddnsWarningRecord?.type
                                        }) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" class="rounded-xl" @click="cancelDdnsWarning">{{
                                $t('common.cancel') }}</UButton>
                            <UButton color="warning" variant="solid" class="rounded-xl shadow-sm"
                                @click="confirmDdnsWarning">{{ $t('ddns_warning.confirm') }}</UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <UModal v-model:open="historyModalOpen" :ui="{ content: 'sm:max-w-lg' }">
            <template #content>
                <UCard
                    :ui="{ header: 'border-b border-slate-200 dark:border-slate-800', footer: 'border-t border-slate-200 dark:border-slate-800', body: 'p-0 sm:p-0' }"
                    class="ring-0 overflow-hidden">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                    $t('records.history_title') }}</h3>
                                <p class="text-xs text-slate-500">{{ $t('records.history_desc', {
                                    name:
                                        historyRecord?.name
                                }) }}</p>
                            </div>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="historyModalOpen = false" />
                        </div>
                    </template>

                    <div class="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/20">
                        <div v-if="historyLoading" class="flex justify-center py-10">
                            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                        <div v-else-if="historyLogs.length === 0"
                            class="flex flex-col items-center justify-center py-10 text-center">
                            <UIcon name="i-heroicons-clock" class="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                            <p class="text-sm font-medium text-slate-500">{{ $t('records.history_empty') }}</p>
                        </div>
                        <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-2">
                            <div v-for="log in historyLogs" :key="log.id"
                                class="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div>
                                    <div class="flex items-center gap-2.5">
                                        <span
                                            class="font-mono text-xs line-through text-slate-400 dark:text-slate-500">{{
                                                log.oldIp
                                            }}</span>
                                        <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5 text-slate-400" />
                                        <span
                                            class="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold">{{
                                                log.newIp
                                            }}</span>
                                    </div>
                                    <p class="text-[11px] font-medium text-slate-500 mt-1.5">{{
                                        formatDate(log.createdAt) }}</p>
                                </div>
                                <UBadge :color="log.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle"
                                    size="xs" class="uppercase font-bold tracking-wider">
                                    {{ log.status }}
                                </UBadge>
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex justify-end">
                            <UButton color="neutral" variant="ghost" class="rounded-xl"
                                @click="historyModalOpen = false">{{ $t('common.close') }}</UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

    </div>
</template>