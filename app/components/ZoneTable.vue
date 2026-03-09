<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { fetchZones, deleteZone } = useZones()
const { fetchAccounts } = useAccounts()
const toast = useToast()

const zones = ref<any[]>([])
const accounts = ref<any[]>([])
const pending = ref(true)
const isAddModalOpen = ref(false)
const searchQuery = ref('')
const isImportModalOpen = ref(false)
const importAccountId = ref<number | null>(null)
const importLoading = ref(false)

const filteredZones = computed(() => {
    if (!searchQuery.value) return zones.value
    const q = searchQuery.value.toLowerCase()
    return zones.value.filter((z: any) =>
        z.name.toLowerCase().includes(q) || z.cfZoneId.toLowerCase().includes(q)
    )
})

// Delete confirm modal
const deleteModalOpen = ref(false)
const deletingZone = ref<any>(null)
const deleteLoading = ref(false)

import { computed } from 'vue'
const { t } = useI18n()

const columns = computed(() => [
    { accessorKey: 'name', header: t('zones.col_name') },
    { accessorKey: 'cfZoneId', header: t('zones.col_id') },
    { id: 'accountLabel', header: t('zones.col_account') },
    { id: 'records', header: t('zones.col_records') },
    { id: 'actions', header: t('zones.col_actions') }
])

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

onMounted(() => loadData())

const hasAccounts = computed(() => accounts.value.length > 0)

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

const accountOptions = computed(() =>
    accounts.value.map((a: any) => ({ label: `${a.label} (${a.email})`, value: a.id }))
)

const exportJson = () => {
    window.open('/api/records/export', '_blank')
}
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex flex-wrap items-center justify-between">
                <div class="columns-12 lg:columns-6 flex flex-col">
                    <h2 class="text-lg font-semibold">{{ $t('zones.title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('zones.subtitle') }}</p>
                </div>
                <div class="columns-12 lg:columns-6 flex flex-wrap gap-2 lg:w-auto w-full justify-end">
                    <UButton icon="i-heroicons-document-arrow-down" color="neutral" variant="ghost"
                        :disabled="!hasAccounts" @click="exportJson">
                        {{ $t('zones.export_json') }}
                    </UButton>
                    <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" :disabled="!hasAccounts"
                        @click="openImportModal">
                        {{ $t('zones.import_all') }}
                    </UButton>
                    <UButton icon="i-heroicons-plus" color="primary" :disabled="!hasAccounts"
                        @click="isAddModalOpen = true">
                        {{ $t('zones.add_zone') }}
                    </UButton>
                </div>
            </div>
        </template>

        <!-- Warning banner when no accounts exist -->
        <div v-if="!hasAccounts" class="p-8 text-center text-gray-400">
            <span>{{ $t('zones.no_accounts_warning') }}</span>
        </div>

        <div v-if="hasAccounts">
            <!-- Search -->
            <div class="mb-4">
                <UInput v-model="searchQuery" :placeholder="$t('common.search')" icon="i-heroicons-magnifying-glass"
                    class="max-w-sm" />
            </div>

            <UTable :data="filteredZones" :columns="columns" :loading="pending">
                <template #accountLabel-cell="{ row }">
                    <UBadge color="neutral" variant="subtle">{{ row.original?.account?.label || 'N/A' }}</UBadge>
                </template>
                <template #records-cell="{ row }">
                    <UBadge color="secondary" variant="solid">{{ row.original?._count?.records || 0 }}</UBadge>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton size="sm" color="secondary" variant="ghost" icon="i-heroicons-cog-8-tooth"
                            :to="`/zones/${row.original.cfZoneId}`">
                            {{ $t('common.edit') }}
                        </UButton>
                        <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                            @click="openDeleteModal(row.original)" />
                    </div>
                </template>
            </UTable>

            <ZoneAddModal v-if="isAddModalOpen" :accounts="accounts" @close="isAddModalOpen = false"
                @refresh="loadData" />

            <!-- Delete Confirm Modal -->
            <UModal v-model:open="deleteModalOpen" :title="$t('common.delete')"
                :description="$t('zones.delete_modal_desc')">
                <template #body>
                    <div class="space-y-4">
                        <div class="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm">
                            <h3 class="font-medium">{{ $t('zones.delete_confirm', { name: deletingZone?.name }) }}</h3>
                            <p class="text-gray-400 mt-1">{{ $t('zones.delete_modal_text') }}</p>
                        </div>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" @click="deleteModalOpen = false">{{
                                $t('common.cancel')
                            }}</UButton>
                            <UButton color="error" :loading="deleteLoading" @click="executeDelete">{{
                                $t('common.delete') }}
                            </UButton>
                        </div>
                    </div>
                </template>
            </UModal>

            <!-- Bulk Import Modal -->
            <UModal v-model:open="isImportModalOpen" :title="$t('zones.import_modal_title')"
                :description="$t('zones.import_modal_desc')">
                <template #body>
                    <div class="space-y-4">
                        <p class="text-sm text-gray-300">{{ $t('zones.import_info') }}</p>
                        <UFormField :label="$t('zones.account_field')" name="account">
                            <USelect v-model="importAccountId" :items="accountOptions" value-key="value"
                                class="w-full" />
                        </UFormField>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" @click="isImportModalOpen = false">{{
                                $t('common.cancel') }}</UButton>
                            <UButton color="primary" :loading="importLoading" @click="executeBulkImport">{{
                                $t('common.import') }}</UButton>
                        </div>
                    </div>
                </template>
            </UModal>
        </div>
    </UCard>
</template>
