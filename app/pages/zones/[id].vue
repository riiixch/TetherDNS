<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const cfZoneId = route.params.id as string
const toast = useToast()
const { fetchRecords, toggleAutoUpdate, updateRecord, deleteRecord } = useRecords()

const records = ref<any[]>([])
const zoneName = ref('')
const pending = ref(true)
const searchQuery = ref('')

const filteredRecords = computed(() => {
    if (!searchQuery.value) return records.value
    const q = searchQuery.value.toLowerCase()
    return records.value.filter((r: any) =>
        r.name.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    )
})

// Modals
const isAddModalOpen = ref(false)
const editingRecord = ref<any>(null)

// DDNS warning modal
const ddnsWarningOpen = ref(false)
const ddnsWarningRecord = ref<any>(null)

import { computed } from 'vue'
const { t } = useI18n()

const columns = computed(() => [
    { accessorKey: 'type', header: t('records.col_type') },
    { accessorKey: 'name', header: t('records.col_name') },
    { accessorKey: 'content', header: t('records.col_content') },
    { id: 'proxied', header: t('records.col_proxied') },
    { id: 'autoUpdate', header: t('records.col_ddns') },
    { id: 'actions', header: t('records.col_actions') },
])

const loadData = async () => {
    pending.value = true
    try {
        const data = await fetchRecords(cfZoneId)
        records.value = data
        if (data.length > 0 && data[0].zone) {
            zoneName.value = data[0].zone.name
        }
    } catch (e: any) {
        toast.add({ title: 'Error loading records', description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

onMounted(() => loadData())

const handleToggle = async (record: any) => {
    const newValue = !record.isAutoUpdate

    // If enabling auto-update on a non-A/AAAA record, show warning
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
        // Fetch current public IP to use as content for the A record
        const ipRes = await $fetch<{ ip: string }>('https://api.ipify.org?format=json')
        const currentIp = ipRes?.ip

        if (!currentIp) {
            toast.add({ title: 'Error', description: 'Failed to fetch current IP address.', color: 'error' })
            return
        }

        // Change type to A, set content to current IP, and enable auto-update
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

// Delete confirm modal
const deleteRecordModalOpen = ref(false)
const deletingRecord = ref<any>(null)
const deleteRecordLoading = ref(false)

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

// Propagation Check Modal
const propagationModalOpen = ref(false)
const propagationRecord = ref<any>(null)
const propagationResults = ref<any>(null)
const propagationLoading = ref(false)

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

// IP History Modal
const historyModalOpen = ref(false)
const historyRecord = ref<any>(null)
const historyLogs = ref<any[]>([])
const historyLoading = ref(false)

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
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center gap-3">
            <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" to="/" />
            <div>
                <h1 class="text-2xl font-bold">{{ zoneName || 'DNS Records' }}</h1>
                <p class="text-sm text-gray-400 font-mono">Zone ID: {{ cfZoneId }}</p>
            </div>
        </div>

        <UCard>
            <template #header>
                <div class="flex flex-wrap items-center justify-between">
                    <div class="columns-12 lg:columns-6 flex flex-col">
                        <h2 class="text-lg font-semibold">{{ $t('records.title') }}</h2>
                        <p class="text-sm text-gray-400">{{ $t('records.subtitle') }}</p>
                    </div>
                    <div class="columns-12 lg:columns-6 flex gap-2 lg:w-auto w-full justify-end">
                        <UButton icon="i-heroicons-arrow-path" color="neutral" variant="ghost" @click="loadData"
                            :loading="pending">
                            {{ $t('common.refresh') }}
                        </UButton>
                        <UButton icon="i-heroicons-plus" color="primary" @click="isAddModalOpen = true">
                            {{ $t('records.add_record') }}
                        </UButton>
                    </div>
                </div>
            </template>

            <!-- Search -->
            <div class="mb-4">
                <UInput v-model="searchQuery" :placeholder="$t('records.search_placeholder')"
                    icon="i-heroicons-magnifying-glass" class="max-w-sm" />
            </div>

            <ClientOnly>
                <UTable :data="filteredRecords" :columns="columns" :loading="pending" class="overflow-auto relative"
                    :ui="{
                        th: 'sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-[0_1px_0_0_theme(colors.gray.200)] dark:shadow-[0_1px_0_0_theme(colors.gray.800)] whitespace-nowrap'
                    }">
                    <template #type-cell="{ row }">
                        <UBadge
                            :color="row.original.type === 'A' ? 'primary' : row.original.type === 'AAAA' ? 'info' : 'warning'"
                            variant="subtle">
                            {{ row.original.type }}
                        </UBadge>
                    </template>
                    <template #content-cell="{ row }">
                        <div class="max-w-[20ch] sm:max-w-[40ch] truncate" :title="row.original.content">
                            {{ row.original.content }}
                        </div>
                    </template>
                    <template #proxied-cell="{ row }">
                        <UBadge :color="row.original.proxied ? 'warning' : 'neutral'" variant="subtle">
                            {{ row.original.proxied ? 'Proxied' : 'DNS Only' }}
                        </UBadge>
                    </template>
                    <template #autoUpdate-cell="{ row }">
                        <USwitch :model-value="row.original.isAutoUpdate"
                            @update:model-value="handleToggle(row.original)" color="primary" />
                    </template>
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end gap-1">
                            <UButton v-if="row.original.type === 'A' || row.original.type === 'AAAA'" size="sm"
                                color="neutral" variant="ghost" icon="i-heroicons-clock" title="View IP History"
                                @click="openHistory(row.original)" />
                            <UButton v-if="row.original.type === 'A' || row.original.type === 'AAAA'" size="sm"
                                color="info" variant="ghost" icon="i-heroicons-globe-alt" title="Check DNS Propagation"
                                @click="checkPropagation(row.original)" />
                            <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-pencil-square"
                                @click="openEdit(row.original)" />
                            <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                                @click="openDeleteModal(row.original)" />
                        </div>
                    </template>
                </UTable>
            </ClientOnly>

            <div v-if="!pending && records.length === 0" class="py-8 text-center text-gray-400">
                <p>No A, AAAA, or CNAME records found for this zone.</p>
            </div>
        </UCard>

        <!-- Add Record Modal -->
        <RecordAddModal v-if="isAddModalOpen" :cf-zone-id="cfZoneId" @close="isAddModalOpen = false"
            @refresh="loadData" />

        <!-- Edit Record Modal -->
        <RecordEditModal v-if="editingRecord" :record="editingRecord" @close="editingRecord = null"
            @refresh="loadData" />

        <!-- Delete Record Confirm Modal -->
        <UModal v-model:open="deleteRecordModalOpen" :title="$t('common.delete')" description="Confirm record deletion">
            <template #body>
                <div class="space-y-4">
                    <div class="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm">
                        <p class="font-semibold text-red-400 mb-2">{{ $t('common.are_you_sure') }}</p>
                        <p class="text-gray-300">
                            {{ $t('records.delete_confirm', { name: deletingRecord?.name }) }}
                        </p>
                        <p class="text-gray-400 mt-1">{{ $t('records.delete_warning') }}</p>
                    </div>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="ghost" @click="deleteRecordModalOpen = false">{{
                            $t('common.cancel') }}</UButton>
                        <UButton color="error" :loading="deleteRecordLoading" @click="executeDeleteRecord">{{
                            $t('common.delete') }}</UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Propagation Check Modal -->
        <UModal v-model:open="propagationModalOpen" :title="$t('propagation.title')"
            :description="$t('propagation.desc', { name: propagationRecord?.name })">
            <template #body>
                <div class="space-y-4">
                    <div v-if="propagationLoading"
                        class="flex flex-col items-center justify-center py-6 space-y-3 relative overflow-hidden">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
                        <p class="text-sm text-gray-400">{{ $t('propagation.querying') }}</p>

                        <!-- Pulse effect -->
                        <div class="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse -z-10"></div>
                    </div>

                    <div v-else-if="propagationResults" class="space-y-4">
                        <div class="flex items-center justify-between p-3 rounded-lg border"
                            :class="propagationResults.fullyPropagated ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'">
                            <div>
                                <h3 class="font-medium"
                                    :class="propagationResults.fullyPropagated ? 'text-green-400' : 'text-yellow-400'">
                                    {{
                                        propagationResults.fullyPropagated ? $t('propagation.fully_propagated') :
                                            $t('propagation.in_progress')
                                    }}
                                </h3>
                                <p class="text-xs text-gray-400 mt-1">{{ $t('propagation.expected_ip') }} <strong
                                        class="text-gray-200">{{
                                            propagationResults.expected }}</strong></p>
                            </div>
                            <UIcon
                                :name="propagationResults.fullyPropagated ? 'i-heroicons-check-circle' : 'i-heroicons-clock'"
                                class="w-8 h-8"
                                :class="propagationResults.fullyPropagated ? 'text-green-500' : 'text-yellow-500'" />
                        </div>

                        <div class="space-y-2 mt-4">
                            <h4 class="text-sm font-semibold text-gray-300">{{ $t('propagation.resolver_status') }}</h4>
                            <div v-for="res in propagationResults.results" :key="res.resolver"
                                class="flex items-center justify-between p-2.5 rounded-md bg-gray-900 border border-gray-800 transition-all hover:border-gray-700">
                                <div class="flex items-center gap-3">
                                    <UIcon :name="res.propagated ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                                        class="w-5 h-5" :class="res.propagated ? 'text-green-500' : 'text-red-500'" />
                                    <span class="text-sm font-medium">{{ res.resolver }}</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-xs font-mono"
                                        :class="res.propagated ? 'text-green-400' : 'text-red-400'">
                                        {{ res.resolved?.length ? res.resolved.join(', ') : $t('propagation.not_found')
                                        }}
                                    </span>
                                    <p v-if="res.error" class="text-[10px] text-red-500 mt-0.5">{{ res.error }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end pt-2">
                        <UButton color="neutral" variant="ghost" @click="propagationModalOpen = false">{{
                            $t('common.close') }}</UButton>
                        <UButton v-if="propagationResults && !propagationResults.fullyPropagated"
                            icon="i-heroicons-arrow-path" color="primary" variant="subtle"
                            @click="checkPropagation(propagationRecord)">{{ $t('common.refresh') }}</UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- DDNS Type Warning Modal -->
        <UModal v-model:open="ddnsWarningOpen" :title="$t('ddns_warning.title')"
            :description="$t('ddns_warning.subtitle')">
            <template #body>
                <div class="space-y-4">
                    <div class="rounded-md bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 text-sm">
                        <p class="font-semibold text-yellow-400 mb-2">{{ $t('ddns_warning.subtitle') }}</p>
                        <p class="text-gray-300">
                            {{ $t('ddns_warning.desc1') }}
                        </p>
                        <p class="text-gray-300 mt-2">
                            {{ $t('ddns_warning.desc2', {
                                name: ddnsWarningRecord?.name, type: ddnsWarningRecord?.type
                            }) }}
                        </p>
                    </div>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="ghost" @click="cancelDdnsWarning">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton color="warning" @click="confirmDdnsWarning">{{ $t('ddns_warning.confirm') }}</UButton>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- IP History Modal -->
        <UModal v-model:open="historyModalOpen" :title="$t('records.history_title')"
            :description="$t('records.history_desc', { name: historyRecord?.name })">
            <template #body>
                <div class="space-y-4">
                    <div v-if="historyLoading" class="flex justify-center py-8">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <div v-else-if="historyLogs.length === 0" class="text-center py-6 text-gray-400">
                        <p>{{ $t('records.history_empty') }}</p>
                    </div>
                    <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-2">
                        <div v-for="log in historyLogs" :key="log.id"
                            class="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900">
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-mono text-sm line-through text-gray-500">{{ log.oldIp }}</span>
                                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-gray-400" />
                                    <span class="font-mono text-sm text-green-400 font-bold">{{ log.newIp }}</span>
                                </div>
                                <p class="text-[11px] text-gray-400 mt-1">{{ formatDate(log.createdAt) }}</p>
                            </div>
                            <UBadge :color="log.status === 'SUCCESS' ? 'success' : 'error'" variant="subtle">
                                {{ log.status }}
                            </UBadge>
                        </div>
                    </div>
                    <div class="flex justify-end pt-2">
                        <UButton color="neutral" variant="ghost" @click="historyModalOpen = false">{{ $t('common.close')
                            }}</UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
