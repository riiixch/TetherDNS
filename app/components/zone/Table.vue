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
            <div class="flex flex-col gap-4 p-2">
                <!-- Top Row: Title and Main Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex flex-col">
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            {{ $t('zones.title') }}
                        </h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {{ $t('zones.subtitle') }}
                        </p>
                    </div>

                    <!-- Actions for Tablet/PC -->
                    <div class="hidden sm:flex items-center gap-2">
                        <UButton icon="i-heroicons-document-arrow-down" color="neutral" variant="soft"
                            :disabled="!hasAccounts" class="rounded-xl font-bold px-3" size="sm"
                            @click="exportJson">
                            <span class="hidden lg:inline">{{ $t('zones.export_json') }}</span>
                            <span class="lg:hidden">Export</span>
                        </UButton>

                        <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="soft"
                            :disabled="!hasAccounts" class="rounded-xl font-bold px-3" size="sm"
                            @click="openImportModal">
                            <span class="hidden lg:inline">{{ $t('zones.import_all') }}</span>
                            <span class="lg:hidden">Import</span>
                        </UButton>

                        <UButton icon="i-heroicons-plus" color="primary" variant="solid" :disabled="!hasAccounts"
                            class="rounded-xl font-bold shadow-sm px-4"
                            size="sm" @click="isAddModalOpen = true">
                            {{ $t('zones.add_zone') }}
                        </UButton>
                    </div>
                </div>

                <!-- Bottom Row: Search & Mobile Actions -->
                <div class="flex flex-col sm:flex-row items-center gap-3">
                    <!-- Search Bar (Full width on mobile) -->
                    <div v-if="hasAccounts" class="w-full sm:max-w-xs md:max-w-md lg:max-w-lg">
                        <UInput v-model="searchQuery" :placeholder="$t('common.search')" icon="i-heroicons-magnifying-glass"
                            size="sm"
                            :ui="{ root: 'rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500' }" />
                    </div>

                    <!-- Mobile-only Actions Grid -->
                    <div class="grid grid-cols-3 gap-2 w-full sm:hidden">
                        <UButton icon="i-heroicons-document-arrow-down" color="neutral" variant="soft"
                            :disabled="!hasAccounts" class="rounded-xl font-bold justify-center" size="sm"
                            @click="exportJson" />
                        <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="soft"
                            :disabled="!hasAccounts" class="rounded-xl font-bold justify-center" size="sm"
                            @click="openImportModal" />
                        <UButton icon="i-heroicons-plus" color="primary" variant="solid" :disabled="!hasAccounts"
                            class="rounded-xl font-bold shadow-sm justify-center"
                            size="sm" @click="isAddModalOpen = true" />
                    </div>
                </div>
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

        <!-- Desktop Table View (lg and up) -->
        <div v-if="hasAccounts || pending" class="hidden lg:block overflow-x-auto">
            <UTable :data="filteredZones" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-4 border-b border-slate-200 dark:border-slate-800 lg:text-sm uppercase tracking-wider',
                td: 'py-4 lg:text-base text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #name-cell="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-blue-500" />
                        </div>
                        <span class="font-bold text-slate-900 dark:text-white">{{ row.original.name }}</span>
                    </div>
                </template>

                <template #cfZoneId-cell="{ row }">
                    <span class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ row.original.cfZoneId
                    }}</span>
                </template>

                <template #accountLabel-cell="{ row }">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {{ (row.original?.account?.label || 'A').charAt(0).toUpperCase() }}
                        </div>
                        <span class="font-medium text-slate-600 dark:text-slate-300">{{ row.original?.account?.label ||
                            'N/A' }}</span>
                    </div>
                </template>

                <template #records-cell="{ row }">
                    <UBadge color="info" variant="subtle" size="sm" class="font-bold px-2.5">
                        {{ row.original?._count?.records || 0 }} {{ $t('nav.records') || 'Records' }}
                    </UBadge>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-pencil-square"
                            class="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                            :to="`/zones/${row.original.cfZoneId}`">
                            {{ $t('common.edit') }}
                        </UButton>
                        <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95"
                            @click="openDeleteModal(row.original)" />
                    </div>
                </template>
            </UTable>
        </div>

        <!-- Mobile/Tablet Card View (below lg) -->
        <div v-if="hasAccounts || pending"
            class="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 min-h-[400px]">
            <template v-if="pending">
                <div v-for="i in 3" :key="i"
                    class="p-5 bg-white dark:bg-slate-900 rounded-3xl animate-pulse h-48 ring-1 ring-slate-200 dark:ring-slate-800">
                </div>
            </template>
            <template v-else-if="filteredZones.length === 0">
                <div class="py-20 text-center">
                    <div
                        class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 text-slate-400" />
                    </div>
                    <p class="text-base font-bold text-slate-900 dark:text-white">{{ $t('common.no_results') }}</p>
                </div>
            </template>
            <template v-else>
                <div v-for="zone in filteredZones" :key="zone.id"
                    class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 hover:border-blue-500/50 transition-all group">

                    <!-- Top Info: Globe + Name + Records -->
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-4 min-w-0">
                            <div
                                class="w-12 h-12 shrink-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <UIcon name="i-heroicons-globe-alt-solid" class="w-6 h-6 text-blue-500" />
                            </div>
                            <div class="min-w-0">
                                <h3 class="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{{
                                    zone.name }}</h3>
                                <div class="flex items-center gap-1.5 mt-1">
                                    <span
                                        class="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                        ID: {{ zone.cfZoneId.substring(0, 8) }}...
                                    </span>
                                </div>
                            </div>
                        </div>
                        <UBadge color="info" variant="subtle" size="sm"
                            class="font-black px-3 py-1 rounded-xl shrink-0">
                            {{ zone?._count?.records || 0 }} {{ $t('nav.records') || 'Records' }}
                        </UBadge>
                    </div>

                    <!-- Middle Info: Connected Account -->
                    <div
                        class="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                        <div
                            class="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                            {{ (zone?.account?.label || 'A').charAt(0).toUpperCase() }}
                        </div>
                        <div class="flex flex-col min-w-0">
                            <span
                                class="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Account</span>
                            <span class="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none truncate">{{
                                zone?.account?.label || 'N/A' }}</span>
                        </div>
                    </div>

                    <!-- Bottom Actions: Full Width -->
                    <div class="flex gap-2 pt-1">
                        <UButton size="md" color="neutral" variant="soft" icon="i-heroicons-pencil-square" block
                            class="rounded-2xl font-bold flex-1" :to="`/zones/${zone.cfZoneId}`">
                            {{ $t('common.edit') }}
                        </UButton>
                        <UButton size="md" color="error" variant="soft" icon="i-heroicons-trash"
                            class="rounded-2xl px-4" @click="openDeleteModal(zone)" />
                    </div>
                </div>
            </template>
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