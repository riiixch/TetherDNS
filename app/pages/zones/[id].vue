<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const { t } = useI18n()
definePageMeta({ layout: 'default' })

const route = useRoute()
const cfZoneId = route.params.id as string
const toast = useToast()
const { fetchRecords, toggleAutoUpdate, updateRecord, deleteRecord } = useRecords()
const { fetchZones } = useZones()

// State
const records = ref<any[]>([])
const allZones = ref<any[]>([])
const zoneName = ref('')
const pending = ref(true)
const searchQuery = ref('')
const typeFilter = ref('all')
const ddnsOnly = ref(false)
const selectedIds = ref<Set<string>>(new Set())

// Modals State
const isAddModalOpen = ref(false)
const editingRecord = ref<any>(null)
const ddnsWarningOpen = ref(false)
const ddnsWarningRecord = ref<any>(null)
const deleteRecordModalOpen = ref(false)
const deletingRecord = ref<any>(null)
const deleteRecordLoading = ref(false)
const propagationModalOpen = ref(false)
const propagationRecord = ref<any>(null)
const propagationResults = ref<any>(null)
const propagationLoading = ref(false)
const historyModalOpen = ref(false)
const historyRecord = ref<any>(null)
const historyLogs = ref<any[]>([])
const historyLoading = ref(false)

const typesList = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA']

// Filtered Records
const filteredRecords = computed(() => {
    let list = records.value
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter((r: any) =>
            r.name.toLowerCase().includes(q) ||
            r.content.toLowerCase().includes(q)
        )
    }
    if (typeFilter.value !== 'all') {
        list = list.filter((r: any) => r.type === typeFilter.value)
    }
    if (ddnsOnly.value) {
        list = list.filter((r: any) => r.isAutoUpdate)
    }
    return list
})

// Bulk selection helpers
const isAllSelected = computed(() => {
    return filteredRecords.value.length > 0 && filteredRecords.value.every(r => selectedIds.value.has(r.id))
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedIds.value.clear()
    } else {
        filteredRecords.value.forEach(r => selectedIds.value.add(r.id))
    }
}

const toggleSelect = (id: string) => {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id)
    } else {
        selectedIds.value.add(id)
    }
}

// Actions
const loadData = async () => {
    pending.value = true
    try {
        const [recs, zns] = await Promise.all([
            fetchRecords(cfZoneId),
            fetchZones()
        ])
        records.value = recs
        allZones.value = zns
        const currentZone = zns.find((z: any) => z.cfZoneId === cfZoneId)
        if (currentZone) {
            zoneName.value = currentZone.name
        } else if (recs.length > 0 && recs[0].zone) {
            zoneName.value = recs[0].zone.name
        }
        useHead({ title: `${zoneName.value || 'DNS'} - Records | TetherDNS` })
    } catch (e: any) {
        toast.add({ title: t('zones.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const copyContent = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({ title: t('common.success'), description: 'Copied to clipboard', color: 'success' })
    } catch {
        /* fallback */
    }
}

const toggleProxy = async (record: any) => {
    if (!['A', 'AAAA', 'CNAME'].includes(record.type)) return
    const prev = record.proxied
    try {
        record.proxied = !prev
        await updateRecord(record.id, { proxied: record.proxied })
        toast.add({
            title: record.proxied ? t('records.proxied') : t('records.dns_only'),
            description: `Proxy is now ${record.proxied ? 'enabled' : 'disabled'} for ${record.name}`,
            color: record.proxied ? 'success' : 'neutral'
        })
    } catch (e: any) {
        record.proxied = prev
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

const handleToggleDdns = async (record: any) => {
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
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

const confirmDdnsWarning = async () => {
    if (!ddnsWarningRecord.value) return
    try {
        const ipRes = await $fetch<{ ip: string }>('https://api.ipify.org?format=json')
        const currentIp = ipRes?.ip
        if (!currentIp) {
            toast.add({ title: t('common.failed'), description: t('accounts.conn_failed'), color: 'error' })
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

const executeDeleteRecord = async () => {
    if (!deletingRecord.value) return
    deleteRecordLoading.value = true
    try {
        await deleteRecord(deletingRecord.value.id)
        toast.add({ title: t('common.success'), description: t('records.delete_success', { name: deletingRecord.value.name }), color: 'success' })
        selectedIds.value.delete(deletingRecord.value.id)
        loadData()
    } catch (e: any) {
        toast.add({ title: 'Delete Failed', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        deleteRecordLoading.value = false
        deleteRecordModalOpen.value = false
        deletingRecord.value = null
    }
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
        historyLogs.value = res.data || []
    } catch (e: any) {
        toast.add({ title: 'Failed to load history', description: e.data?.statusMessage || e.message, color: 'error' })
        historyModalOpen.value = false
    } finally {
        historyLoading.value = false
    }
}

const bulkSetDdns = async (enabled: boolean) => {
    const targets = records.value.filter(r => selectedIds.value.has(r.id))
    try {
        await Promise.all(targets.map(r => toggleAutoUpdate(r.id, enabled)))
        targets.forEach(r => { r.isAutoUpdate = enabled })
        toast.add({ title: t('common.success'), description: `Updated ${targets.length} records`, color: 'success' })
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

const bulkDelete = async () => {
    const targets = Array.from(selectedIds.value)
    if (!confirm(`Are you sure you want to delete ${targets.length} records?`)) return
    try {
        await Promise.all(targets.map(id => deleteRecord(id)))
        toast.add({ title: t('common.success'), description: `Deleted ${targets.length} records`, color: 'success' })
        selectedIds.value.clear()
        loadData()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

const formatTtl = (ttl: number) => {
    if (!ttl || ttl === 1) return 'Auto'
    if (ttl < 60) return `${ttl}s`
    if (ttl < 3600) return `${Math.round(ttl / 60)}m`
    return `${Math.round(ttl / 3600)}h`
}

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="space-y-6 flex flex-col h-full pb-10">
        <!-- Page Head matching ref.html -->
        <section class="page-head">
            <div class="ph-left">
                <NuxtLink to="/zones" class="icon-btn mr-2" title="Back to Zones">
                    <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                </NuxtLink>
                <div class="ph-icon">
                    <UIcon name="i-heroicons-globe-alt" class="w-6 h-6 text-[var(--cyan)]" />
                </div>
                <div>
                    <h1>{{ zoneName || 'DNS Records' }}</h1>
                    <p class="sub font-mono text-xs text-[var(--text3)]">
                        Zone ID: {{ cfZoneId }}
                    </p>
                </div>
            </div>
            <div class="ph-right">
                <button
                    type="button"
                    class="btn-ref ghost"
                    :disabled="pending"
                    @click="loadData"
                >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': pending }" />
                    <span>{{ $t('common.refresh') }}</span>
                </button>
                <button
                    type="button"
                    class="btn-ref primary"
                    @click="isAddModalOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('records.add_record') }}</span>
                </button>
            </div>
        </section>

        <!-- Zone Tabs matching ref.html -->
        <div v-if="allZones.length > 0" class="zone-tabs overflow-x-auto pb-1">
            <NuxtLink
                v-for="z in allZones"
                :key="z.id"
                :to="`/zones/${z.cfZoneId}`"
                class="ztab"
                :class="{ on: z.cfZoneId === cfZoneId }"
            >
                <UIcon name="i-heroicons-globe-alt" class="w-3.5 h-3.5 opacity-80" />
                <span class="truncate max-w-[140px]">{{ z.name }}</span>
                <span class="zcount">{{ z._count?.records ?? 0 }}</span>
            </NuxtLink>
        </div>

        <!-- Main Toolbar & Records Card -->
        <div class="card toolbar-card">
            <!-- Toolbar -->
            <div class="toolbar flex flex-wrap items-center gap-3">
                <div class="search">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)]" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        :placeholder="$t('records.search_placeholder')"
                        autocomplete="off"
                    />
                </div>

                <select v-model="typeFilter" class="input select max-w-[130px]">
                    <option value="all">All Types</option>
                    <option v-for="t in typesList" :key="t" :value="t">{{ t }}</option>
                </select>

                <label class="toggle-chip" :class="{ on: ddnsOnly }">
                    <input v-model="ddnsOnly" type="checkbox" />
                    <UIcon name="i-heroicons-bolt" class="w-3.5 h-3.5" />
                    <span>DDNS only</span>
                </label>

                <div class="spacer"></div>
            </div>

            <!-- Bulk actions bar -->
            <div class="bulkbar" :class="{ show: selectedIds.size > 0 }">
                <span>{{ selectedIds.size }} selected</span>
                <button type="button" class="btn-ref ghost sm flex items-center gap-1.5" @click="bulkSetDdns(true)">
                    <UIcon name="i-heroicons-bolt" class="w-3.5 h-3.5 text-[var(--amber)]" />
                    <span>DDNS On</span>
                </button>
                <button type="button" class="btn-ref ghost sm" @click="bulkSetDdns(false)">
                    <span>DDNS Off</span>
                </button>
                <button type="button" class="btn-ref danger-ghost sm flex items-center gap-1.5" @click="bulkDelete">
                    <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                    <span>Delete</span>
                </button>
                <button type="button" class="btn-ref ghost sm" @click="selectedIds.clear()">
                    <span>Clear</span>
                </button>
            </div>

            <!-- Table -->
            <div class="table-wrap overflow-x-auto">
                <table class="rtable w-full">
                    <thead>
                        <tr>
                            <th class="cb w-10">
                                <input
                                    type="checkbox"
                                    :checked="isAllSelected"
                                    aria-label="Select all"
                                    @change="toggleSelectAll"
                                />
                            </th>
                            <th>{{ $t('records.col_type') }}</th>
                            <th>{{ $t('records.col_name') }}</th>
                            <th>{{ $t('records.col_content') }}</th>
                            <th>TTL</th>
                            <th>{{ $t('records.col_proxied') }}</th>
                            <th>DDNS</th>
                            <th class="ar text-right">{{ $t('common.actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="pending">
                            <tr>
                                <td colspan="8" class="text-center py-16">
                                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
                                    <p class="text-xs text-[var(--text3)]">Loading DNS records from Cloudflare...</p>
                                </td>
                            </tr>
                        </template>
                        <template v-else-if="filteredRecords.length === 0">
                            <tr class="empty-row">
                                <td colspan="8">
                                    <div class="empty py-16 text-center flex flex-col items-center justify-center">
                                        <UIcon name="i-heroicons-magnifying-glass" class="w-10 h-10 text-[var(--text3)] mb-3" />
                                        <div class="font-bold text-sm text-[var(--text)]">No DNS records found</div>
                                        <span class="text-xs text-[var(--text3)] mt-1">Try adjusting your filters or search query</span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr
                                v-for="r in filteredRecords"
                                :key="r.id"
                                :class="{ sel: selectedIds.has(r.id) }"
                            >
                                <td class="cb">
                                    <input
                                        type="checkbox"
                                        :checked="selectedIds.has(r.id)"
                                        @change="toggleSelect(r.id)"
                                    />
                                </td>
                                <td>
                                    <span class="badge-type" :class="`t-${r.type}`">{{ r.type }}</span>
                                </td>
                                <td class="mono name">
                                    <span class="font-semibold text-[var(--text)]">{{ r.name }}</span>
                                </td>
                                <td class="mono content">
                                    <div class="flex items-center gap-1.5 max-w-[280px]">
                                        <span class="cv truncate" :title="r.content">{{ r.content }}</span>
                                        <button
                                            type="button"
                                            class="mini-copy"
                                            title="Copy target"
                                            @click="copyContent(r.content)"
                                        >
                                            <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                                <td class="mono ttl text-xs text-[var(--text3)]">
                                    {{ formatTtl(r.ttl) }}
                                </td>
                                <td>
                                    <button
                                        v-if="['A', 'AAAA', 'CNAME'].includes(r.type)"
                                        type="button"
                                        class="proxy-btn"
                                        :class="{ on: r.proxied }"
                                        :title="r.proxied ? $t('records.proxied') : $t('records.dns_only')"
                                        @click="toggleProxy(r)"
                                    >
                                        <UIcon name="i-heroicons-cloud" class="w-4 h-4" />
                                    </button>
                                    <span v-else class="text-xs text-[var(--text3)]">—</span>
                                </td>
                                <td>
                                    <label class="switch-ref sm">
                                        <input
                                            type="checkbox"
                                            :checked="r.isAutoUpdate"
                                            @change="handleToggleDdns(r)"
                                        />
                                        <span></span>
                                    </label>
                                </td>
                                <td class="ar text-right">
                                    <div class="flex items-center justify-end gap-1">
                                        <button
                                            v-if="r.type === 'A' || r.type === 'AAAA'"
                                            type="button"
                                            class="icon-btn sm"
                                            :title="$t('records.history_title')"
                                            @click="openHistory(r)"
                                        >
                                            <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            v-if="r.type === 'A' || r.type === 'AAAA'"
                                            type="button"
                                            class="icon-btn sm"
                                            :title="$t('propagation.title')"
                                            @click="checkPropagation(r)"
                                        >
                                            <UIcon name="i-heroicons-globe-alt" class="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            class="icon-btn sm"
                                            title="Edit"
                                            @click="editingRecord = { ...r }"
                                        >
                                            <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            class="icon-btn sm danger"
                                            title="Delete"
                                            @click="() => { deletingRecord = r; deleteRecordModalOpen = true }"
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

            <!-- Table Footer -->
            <div class="table-foot flex items-center justify-between p-4 border-t border-[var(--border)] text-xs text-[var(--text3)]">
                <span>Showing {{ filteredRecords.length }} of {{ records.length }} records</span>
                <span class="hint flex items-center gap-1.5">
                    <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-[var(--green)]" />
                    <span>Synchronized with Cloudflare Edge</span>
                </span>
            </div>
        </div>

        <!-- Add / Edit Modals -->
        <RecordAddModal
            v-if="isAddModalOpen"
            :cf-zone-id="cfZoneId"
            @close="isAddModalOpen = false"
            @refresh="loadData"
        />

        <RecordEditModal
            v-if="editingRecord"
            :record="editingRecord"
            @close="editingRecord = null"
            @refresh="loadData"
        />

        <!-- Propagation Modal -->
        <UModal v-model:open="propagationModalOpen" :ui="{ content: 'sm:max-w-xl' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-[var(--cyan)]" />
                            <h3 class="font-bold text-base text-[var(--text)]">{{ $t('propagation.title') }}</h3>
                        </div>
                        <button type="button" class="icon-btn sm" @click="propagationModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <div v-if="propagationLoading" class="py-12 text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--cyan)] mx-auto mb-2" />
                        <p class="text-xs text-[var(--text3)]">{{ $t('propagation.querying') }}</p>
                    </div>

                    <div v-else-if="propagationResults" class="space-y-4">
                        <div class="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-between">
                            <div>
                                <span class="text-xs text-[var(--text3)] block">Target Record</span>
                                <b class="font-mono text-sm text-[var(--text)]">{{ propagationRecord?.name }}</b>
                            </div>
                            <span class="pill ok">{{ propagationResults.summary || 'Propagated' }}</span>
                        </div>

                        <div class="max-h-60 overflow-y-auto divide-y divide-[var(--border)]">
                            <div
                                v-for="(res, idx) in (propagationResults.resolvers || [])"
                                :key="idx"
                                class="py-2.5 flex items-center justify-between text-xs"
                            >
                                <span class="font-semibold">{{ res.name || res.resolver }}</span>
                                <span class="font-mono" :class="res.matched ? 'text-[var(--green)]' : 'text-[var(--danger)]'">
                                    {{ res.ip || 'NXDOMAIN' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- History Modal -->
        <UModal v-model:open="historyModalOpen" :ui="{ content: 'sm:max-w-lg' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-[var(--green)]" />
                            <h3 class="font-bold text-base text-[var(--text)]">{{ $t('records.history_title') }}</h3>
                        </div>
                        <button type="button" class="icon-btn sm" @click="historyModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <div v-if="historyLoading" class="py-12 text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
                    </div>
                    <div v-else-if="historyLogs.length === 0" class="py-8 text-center text-xs text-[var(--text3)]">
                        No previous IP mutation history found.
                    </div>
                    <div v-else class="space-y-2 max-h-72 overflow-y-auto">
                        <div
                            v-for="log in historyLogs"
                            :key="log.id"
                            class="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-between"
                        >
                            <div class="flex items-center gap-2 font-mono text-xs">
                                <span>{{ log.oldIp || '-' }}</span>
                                <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-[var(--text3)]" />
                                <b class="text-[var(--green)]">{{ log.newIp || '-' }}</b>
                            </div>
                            <span class="text-[11px] text-[var(--text3)]">
                                {{ new Date(log.createdAt).toLocaleString() }}
                            </span>
                        </div>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Delete Confirm Modal -->
        <UModal v-model:open="deleteRecordModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--danger)] flex items-center gap-2">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                            <span>{{ $t('common.delete') }} Record</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="deleteRecordModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        Are you sure you want to permanently delete record <b class="mono">{{ deletingRecord?.name }}</b>? This will also remove it from Cloudflare edge.
                    </p>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="deleteRecordModalOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="button"
                            class="btn-ref danger"
                            :disabled="deleteRecordLoading"
                            @click="executeDeleteRecord"
                        >
                            {{ $t('common.delete') }}
                        </button>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- DDNS Warning Modal -->
        <UModal v-model:open="ddnsWarningOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--amber)] flex items-center gap-2">
                            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5" />
                            <span>{{ $t('ddns_warning.title') }}</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="ddnsWarningOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        {{ $t('ddns_warning.desc2', { name: ddnsWarningRecord?.name, type: ddnsWarningRecord?.type }) }}
                    </p>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="ddnsWarningOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button type="button" class="btn-ref primary" @click="confirmDdnsWarning">
                            {{ $t('ddns_warning.confirm') }}
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
