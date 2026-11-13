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

// Actions
const loadData = async () => {
    pending.value = true
    try {
        const [z, a] = await Promise.all([fetchZones(), fetchAccounts()])
        zones.value = z || []
        accounts.value = a || []
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

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="space-y-6">
        <!-- Page Head matching ref.html -->
        <section class="page-head">
            <div class="ph-left">
                <div class="ph-icon">
                    <UIcon name="i-heroicons-globe-alt" class="w-6 h-6 text-[var(--cyan)]" />
                </div>
                <div>
                    <h1>{{ $t('zones.title') }}</h1>
                    <p class="sub">{{ $t('zones.subtitle') }}</p>
                </div>
            </div>
            <div class="ph-right">
                <button
                    type="button"
                    class="btn-ref ghost"
                    :disabled="!hasAccounts"
                    @click="exportJson"
                >
                    <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
                    <span>{{ $t('zones.export_json') }}</span>
                </button>
                <button
                    type="button"
                    class="btn-ref ghost"
                    :disabled="!hasAccounts"
                    @click="openImportModal"
                >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                    <span>{{ $t('zones.import_all') }}</span>
                </button>
                <button
                    type="button"
                    class="btn-ref primary"
                    :disabled="!hasAccounts"
                    @click="isAddModalOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('zones.add_zone') }}</span>
                </button>
            </div>
        </section>

        <!-- No Accounts Warning -->
        <div v-if="!hasAccounts && !pending" class="card card-ref p-8 text-center flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-2xl bg-[rgba(251,191,36,0.1)] text-[var(--amber)] flex items-center justify-center mb-3">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6" />
            </div>
            <h3 class="font-bold text-base text-[var(--text)] mb-1">
                {{ $t('zones.no_accounts_title') || 'No Accounts Linked' }}
            </h3>
            <p class="text-xs text-[var(--text3)] max-w-sm mb-4">
                {{ $t('zones.no_accounts_warning') }}
            </p>
            <NuxtLink to="/accounts" class="btn-ref primary">
                <UIcon name="i-heroicons-link" class="w-4 h-4" />
                <span>Link Cloudflare Account</span>
            </NuxtLink>
        </div>

        <!-- Zones List Card -->
        <div v-else class="card toolbar-card">
            <div class="toolbar">
                <div class="search">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)]" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        :placeholder="$t('common.search')"
                        autocomplete="off"
                    />
                </div>
                <div class="spacer"></div>
                <span class="chip green font-mono text-xs">
                    {{ filteredZones.length }} Zones
                </span>
            </div>

            <!-- Table -->
            <div class="table-wrap overflow-x-auto">
                <table class="rtable w-full">
                    <thead>
                        <tr>
                            <th>{{ $t('zones.col_name') }}</th>
                            <th>{{ $t('zones.col_id') }}</th>
                            <th>{{ $t('zones.col_account') }}</th>
                            <th>{{ $t('zones.col_records') }}</th>
                            <th>Status</th>
                            <th class="ar text-right">{{ $t('zones.col_actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="pending">
                            <tr>
                                <td colspan="6" class="text-center py-16">
                                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--cyan)] mx-auto mb-2" />
                                    <p class="text-xs text-[var(--text3)]">Loading DNS zones...</p>
                                </td>
                            </tr>
                        </template>
                        <template v-else-if="filteredZones.length === 0">
                            <tr class="empty-row">
                                <td colspan="6">
                                    <div class="empty py-16 text-center flex flex-col items-center justify-center">
                                        <UIcon name="i-heroicons-globe-alt" class="w-10 h-10 text-[var(--text3)] mb-3" />
                                        <div class="font-bold text-sm text-[var(--text)]">No zones found</div>
                                        <span class="text-xs text-[var(--text3)] mt-1">Try syncing from Cloudflare or add a new zone</span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="zone in filteredZones" :key="zone.id">
                                <td>
                                    <NuxtLink
                                        :to="`/zones/${zone.cfZoneId}`"
                                        class="flex items-center gap-2.5 font-bold text-[var(--text)] hover:text-[var(--green)] transition-colors group"
                                    >
                                        <div class="w-7 h-7 rounded-lg bg-[rgba(45,212,238,0.1)] text-[var(--cyan)] flex items-center justify-center">
                                            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                                        </div>
                                        <span class="mono">{{ zone.name }}</span>
                                    </NuxtLink>
                                </td>
                                <td>
                                    <span class="font-mono text-xs text-[var(--text3)]">
                                        {{ zone.cfZoneId }}
                                    </span>
                                </td>
                                <td>
                                    <span class="chip">
                                        {{ zone.account?.label || 'Account' }}
                                    </span>
                                </td>
                                <td>
                                    <span class="chip green">
                                        {{ zone._count?.records || 0 }} Records
                                    </span>
                                </td>
                                <td>
                                    <span class="pill ok">
                                        <span class="dot ok"></span>
                                        ACTIVE
                                    </span>
                                </td>
                                <td class="ar text-right">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <NuxtLink
                                            :to="`/zones/${zone.cfZoneId}`"
                                            class="btn-ref ghost sm flex items-center gap-1"
                                        >
                                            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                                            <span>Manage</span>
                                        </NuxtLink>
                                        <button
                                            type="button"
                                            class="icon-btn sm danger"
                                            title="Delete Zone"
                                            @click="openDeleteModal(zone)"
                                        >
                                            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        <ZoneAddModal
            v-if="isAddModalOpen"
            :accounts="accounts"
            @close="isAddModalOpen = false"
            @refresh="loadData"
        />

        <!-- Import Modal -->
        <UModal v-model:open="isImportModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--text)] flex items-center gap-2">
                            <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-[var(--cyan)]" />
                            <span>{{ $t('zones.import_modal_title') }}</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isImportModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        {{ $t('zones.import_info') }}
                    </p>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            {{ $t('zones.account_field') }}
                        </label>
                        <select v-model="importAccountId" class="input select w-full">
                            <option v-for="opt in accountOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="isImportModalOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="button"
                            class="btn-ref primary"
                            :disabled="importLoading"
                            @click="executeBulkImport"
                        >
                            <UIcon v-if="importLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                            <span>{{ $t('common.import') }}</span>
                        </button>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Delete Confirm Modal -->
        <UModal v-model:open="deleteModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--danger)] flex items-center gap-2">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                            <span>{{ $t('common.delete') }} Zone</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="deleteModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        {{ $t('zones.delete_confirm', { name: deletingZone?.name }) }}
                    </p>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="deleteModalOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="button"
                            class="btn-ref danger"
                            :disabled="deleteLoading"
                            @click="executeDelete"
                        >
                            {{ $t('common.delete') }}
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
