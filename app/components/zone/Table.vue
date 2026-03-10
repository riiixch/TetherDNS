<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { fetchZones, deleteZone } = useZones()
const { fetchAccounts } = useAccounts()
const toast = useToast()
const { t } = useI18n()

// State
const zones = ref<any[]>([])
const accounts = ref<any[]>([])
const pending = ref(true)
const isAddModalOpen = ref(false)
const searchQuery = ref('')

// Import Modal State
const isImportModalOpen = ref(false)
const importAccountId = ref<number | null>(null)
const importLoading = ref(false)

// Delete Confirm Modal State
const deleteModalOpen = ref(false)
const deletingZone = ref<any>(null)
const deleteLoading = ref(false)

// Computed
const filteredZones = computed(() => {
    if (!searchQuery.value) return zones.value
    const q = searchQuery.value.toLowerCase()
    return zones.value.filter((z: any) =>
        z.name.toLowerCase().includes(q) || z.cfZoneId.toLowerCase().includes(q)
    )
})

const hasAccounts = computed(() => accounts.value.length > 0)

const accountOptions = computed(() =>
    accounts.value.map((a: any) => ({ label: `${a.label} (${a.email})`, value: a.id }))
)

const columns = computed(() => [
    { accessorKey: 'name', header: t('zones.col_name') },
    { accessorKey: 'cfZoneId', header: t('zones.col_id') },
    { id: 'accountLabel', header: t('zones.col_account') },
    { id: 'records', header: t('zones.col_records') },
    { id: 'actions', header: t('zones.col_actions') }
])

// Actions
const loadData = async () => {
    pending.value = true
    try {
        const [z, a] = await Promise.all([fetchZones(), fetchAccounts()])
        zones.value = z
        accounts.value = a
    } catch (e: any) {
        toast.add({ title: t('zones.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const openDeleteModal = (zone: any) => {
    deletingZone.value = zone
    deleteModalOpen.value = true
}

const executeDelete = async () => {
    if (!deletingZone.value) return
    deleteLoading.value = true
    try {
        await deleteZone(deletingZone.value.cfZoneId)
        toast.add({ title: t('common.success'), description: t('zones.delete_success', { name: deletingZone.value.name }), color: 'success' })
        loadData()
    } catch (e: any) {
        toast.add({ title: t('zones.delete_failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        deleteLoading.value = false
        deleteModalOpen.value = false
        deletingZone.value = null
    }
}

const openImportModal = () => {
    importAccountId.value = accounts.value.length > 0 ? accounts.value[0].id : null
    isImportModalOpen.value = true
}

const executeBulkImport = async () => {
    if (!importAccountId.value) return
    importLoading.value = true
    try {
        const res = await $fetch<{ message: string; count: number }>('/api/zones/import', {
            method: 'POST',
            body: { accountId: importAccountId.value }
        })
        toast.add({ title: t('zones.import_success'), description: res.message, color: 'success' })
        isImportModalOpen.value = false
        loadData()
    } catch (e: any) {
        toast.add({ title: t('zones.import_failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        importLoading.value = false
    }
}

const exportJson = () => {
    window.open('/api/records/export', '_blank')
}

onMounted(() => loadData())
</script>

<template>
    <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    <div class="flex flex-col">
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{ $t('zones.title')
                        }}</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{{ $t('zones.subtitle')
                        }}</p>
                    </div>

                    <div v-if="hasAccounts" class="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    <UInput v-if="hasAccounts" v-model="searchQuery" :placeholder="$t('common.search')"
                        icon="i-heroicons-magnifying-glass" class="w-full sm:max-w-xs"
                        :ui="{ root: 'rounded-xl transition-colors focus-within:ring-primary-500' }" />
                </div>

                <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                    <UButton icon="i-heroicons-document-arrow-down" color="neutral" variant="soft"
                        :disabled="!hasAccounts" class="rounded-xl font-semibold shadow-sm" @click="exportJson">
                        <span class="hidden sm:inline">{{ $t('zones.export_json') }}</span>
                        <span class="sm:hidden">Export</span>
                    </UButton>

                    <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="soft" :disabled="!hasAccounts"
                        class="rounded-xl font-semibold shadow-sm" @click="openImportModal">
                        <span class="hidden sm:inline">{{ $t('zones.import_all') }}</span>
                        <span class="sm:hidden">Import</span>
                    </UButton>

                    <UButton icon="i-heroicons-plus" color="primary" variant="solid" :disabled="!hasAccounts"
                        class="rounded-xl font-bold shadow-sm" @click="isAddModalOpen = true">
                        {{ $t('zones.add_zone') }}
                    </UButton>
                </div>
            </div>

            <div v-if="hasAccounts" class="sm:hidden mt-4">
                <UInput v-model="searchQuery" :placeholder="$t('common.search')" icon="i-heroicons-magnifying-glass"
                    class="w-full" :ui="{ root: 'rounded-xl' }" />
            </div>
        </template>

        <div v-if="!hasAccounts && !pending" class="flex flex-col items-center justify-center p-12 text-center">
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-slate-400" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-1">
                {{ $t('zones.no_accounts_title') || 'No Accounts Found' }}</h3>
            <p class="text-sm text-slate-500 max-w-sm">{{ $t('zones.no_accounts_warning') }}</p>
        </div>

        <div v-if="hasAccounts || pending" class="overflow-x-auto">
            <UTable :data="filteredZones" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800',
                td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #name-cell="{ row }">
                    <span class="font-semibold text-slate-900 dark:text-white">{{ row.original.name }}</span>
                </template>

                <template #cfZoneId-cell="{ row }">
                    <span class="font-mono text-xs">{{ row.original.cfZoneId }}</span>
                </template>

                <template #accountLabel-cell="{ row }">
                    <UBadge color="neutral" variant="soft" size="xs" class="font-medium">
                        {{ row.original?.account?.label || 'N/A' }}
                    </UBadge>
                </template>

                <template #records-cell="{ row }">
                    <UBadge color="info" variant="subtle" size="xs" class="font-bold">
                        {{ row.original?._count?.records || 0 }}
                    </UBadge>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-1.5">
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-pencil-square"
                            class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            :to="`/zones/${row.original.cfZoneId}`">
                            <span class="sr-only">{{ $t('common.edit') }}</span>
                        </UButton>
                        <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            @click="openDeleteModal(row.original)">
                            <span class="sr-only">{{ $t('common.delete') }}</span>
                        </UButton>
                    </div>
                </template>
            </UTable>
        </div>

        <ZoneAddModal v-if="isAddModalOpen" :accounts="accounts" @close="isAddModalOpen = false" @refresh="loadData" />

        <UModal v-model:open="deleteModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('common.delete') }}
                                Zone</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="deleteModalOpen = false" />
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
                                        {{ $t('zones.delete_confirm', { name: deletingZone?.name }) }}
                                    </h4>
                                    <p class="text-xs text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                                        {{ $t('zones.delete_modal_text') }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" class="rounded-xl"
                                @click="deleteModalOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton color="error" variant="solid" class="rounded-xl shadow-sm" :loading="deleteLoading"
                                @click="executeDelete">
                                {{ $t('common.delete') }}
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <UModal v-model:open="isImportModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('zones.import_modal_title') }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="isImportModalOpen = false" />
                        </div>
                    </template>

                    <div class="py-2 space-y-5">
                        <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('zones.import_info') }}</p>

                        <UFormField :label="$t('zones.account_field')" name="account">
                            <USelect v-model="importAccountId" :items="accountOptions" value-key="value"
                                class="w-full rounded-xl" />
                        </UFormField>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" class="rounded-xl"
                                @click="isImportModalOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton color="primary" variant="solid" class="rounded-xl shadow-sm"
                                :loading="importLoading" @click="executeBulkImport">
                                {{ $t('common.import') }}
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

    </UCard>
</template>