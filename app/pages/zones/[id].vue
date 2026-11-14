<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type {
    ZoneSecuritySettings,
    SecurityLevel,
    IpAccessRule,
    AccessRuleMode,
    AccessRuleTarget,
    WafCustomRule
} from '~~/types/security'

const { t } = useI18n()
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const cfZoneId = route.params.id as string
const resolvedCfZoneId = ref(cfZoneId)
const toast = useToast()
const { fetchRecords, toggleAutoUpdate, updateRecord, deleteRecord } = useRecords()
const { fetchZones } = useZones()
const { startLoading, stopLoading } = useAppLoading()

// State
const records = ref<any[]>([])
const allZones = ref<any[]>([])
const zoneName = ref('')
const pending = ref(true)
const searchQuery = ref('')
const typeFilter = ref('all')
const ddnsOnly = ref(false)
const selectedIds = ref<Set<number | string>>(new Set())

// Security State
const activeTab = ref<'records' | 'security'>((route.query.tab as string) === 'security' ? 'security' : 'records')
const securitySettings = ref<ZoneSecuritySettings | null>(null)
const securityLoading = ref(false)
const securityUpdating = ref(false)
const securityPermissionWarning = ref<string | null>(null)
const accessRules = ref<IpAccessRule[]>([])
const accessRulesLoading = ref(false)
const deletingRuleId = ref<string | null>(null)
const isAddIpModalOpen = ref(false)
const addIpLoading = ref(false)
const wafRules = ref<WafCustomRule[]>([])
const wafRulesLoading = ref(false)
const togglingWafId = ref<string | null>(null)

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

const healthModalOpen = ref(false)
const healthRecord = ref<any>(null)
const healthData = ref<any>(null)
const healthLoading = ref(false)

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

const toggleSelect = (id: number | string) => {
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
        const zns = await fetchZones()
        allZones.value = zns

        // Resolve zone by Cloudflare Zone ID or fallback to database numeric ID
        const currentParam = route.params.id as string
        const matchedZone = zns.find((z: any) => z.cfZoneId === currentParam || String(z.id) === String(currentParam))
        if (matchedZone) {
            resolvedCfZoneId.value = matchedZone.cfZoneId
            zoneName.value = matchedZone.name
        } else {
            resolvedCfZoneId.value = currentParam
        }

        const recs = await fetchRecords(resolvedCfZoneId.value)
        records.value = recs

        if (!zoneName.value && recs.length > 0 && recs[0].zone) {
            zoneName.value = recs[0].zone.name
        }
        useHead({
            title: computed(() => `${zoneName.value || 'DNS'} - ${activeTab.value === 'security' ? 'Security & WAF' : 'Records'} | TetherDNS`)
        })
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

const openHealthModal = async (record: any) => {
    healthRecord.value = record
    healthModalOpen.value = true
    healthLoading.value = true
    healthData.value = null
    try {
        const res = await $fetch<any>(`/api/records/${record.id}/healthcheck`)
        if (res.success) {
            healthData.value = res.data
        }
    } catch (e: any) {
        toast.add({ title: 'Failed to load health check', description: e.message, color: 'error' })
    } finally {
        healthLoading.value = false
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

// Security Operations
const switchTab = (tab: 'records' | 'security') => {
    activeTab.value = tab
    router.replace({ query: { ...route.query, tab: tab === 'security' ? 'security' : undefined } })
    if (tab === 'security' && !securitySettings.value && !securityLoading.value) {
        loadSecurityData()
    }
}

const loadSecurityData = async () => {
    securityLoading.value = true
    accessRulesLoading.value = true
    wafRulesLoading.value = true
    securityPermissionWarning.value = null
    try {
        const [secRes, rulesRes, wafRes] = await Promise.allSettled([
            $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security`),
            $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security/access-rules`),
            $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security/waf-rules`)
        ])

        if (secRes.status === 'fulfilled') {
            if (secRes.value.permissionRequired) {
                securityPermissionWarning.value = secRes.value.message
            } else if (secRes.value.success) {
                securitySettings.value = secRes.value.data
            }
        }
        if (rulesRes.status === 'fulfilled') {
            if (rulesRes.value.permissionRequired && !securityPermissionWarning.value) {
                securityPermissionWarning.value = rulesRes.value.message
            } else if (rulesRes.value.success) {
                accessRules.value = rulesRes.value.data
            }
        }
        if (wafRes.status === 'fulfilled') {
            if (wafRes.value.permissionRequired && !securityPermissionWarning.value) {
                securityPermissionWarning.value = wafRes.value.message
            } else if (wafRes.value.success) {
                wafRules.value = wafRes.value.data
            }
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    } finally {
        securityLoading.value = false
        accessRulesLoading.value = false
        wafRulesLoading.value = false
    }
}

const handleUpdateSecurityLevel = async (level: SecurityLevel) => {
    securityUpdating.value = true
    try {
        const res = await $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security`, {
            method: 'PATCH',
            body: { securityLevel: level }
        })
        if (res.success) {
            securitySettings.value = res.data
            toast.add({
                title: t('common.success'),
                description: t('waf.level_updated_success', { level }),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        securityUpdating.value = false
    }
}

const handleUpdateGeneralSettings = async (data: { challengeTtl?: number; browserCheck?: 'on' | 'off' }) => {
    securityUpdating.value = true
    try {
        const res = await $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security`, {
            method: 'PATCH',
            body: data
        })
        if (res.success) {
            securitySettings.value = res.data
            toast.add({
                title: t('common.success'),
                description: t('waf.settings_updated_success'),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        securityUpdating.value = false
    }
}

const handleAddIpRule = async (payload: { mode: AccessRuleMode; target: AccessRuleTarget; value: string; notes?: string }) => {
    addIpLoading.value = true
    try {
        const res = await $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security/access-rules`, {
            method: 'POST',
            body: payload
        })
        if (res.success) {
            accessRules.value.unshift(res.data)
            isAddIpModalOpen.value = false
            toast.add({
                title: t('common.success'),
                description: t('waf.rule_added_success'),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        addIpLoading.value = false
    }
}

const handleDeleteIpRule = async (ruleId: string) => {
    deletingRuleId.value = ruleId
    try {
        const res = await $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security/access-rules/${ruleId}`, {
            method: 'DELETE'
        })
        if (res.success) {
            accessRules.value = accessRules.value.filter(r => r.id !== ruleId)
            toast.add({
                title: t('common.success'),
                description: t('waf.rule_deleted_success'),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        deletingRuleId.value = null
    }
}

const handleToggleWafRule = async (rule: WafCustomRule, nextState: boolean) => {
    if (!rule.rulesetId) return
    togglingWafId.value = rule.id
    try {
        const res = await $fetch<any>(`/api/zones/${resolvedCfZoneId.value}/security/waf-rules/${rule.id}`, {
            method: 'PATCH',
            body: { rulesetId: rule.rulesetId, enabled: nextState }
        })
        if (res.success) {
            rule.enabled = nextState
            toast.add({
                title: t('common.success'),
                description: t('waf.waf_toggle_success'),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        togglingWafId.value = null
    }
}

watch(() => route.params.id, async (newId) => {
    if (newId) {
        resolvedCfZoneId.value = newId as string
        await loadData()
        if (activeTab.value === 'security') {
            await loadSecurityData()
        }
    }
})

watch(() => route.query.tab, (newTab) => {
    if (newTab === 'security' && activeTab.value !== 'security') {
        activeTab.value = 'security'
        loadSecurityData()
    } else if (newTab !== 'security' && activeTab.value === 'security') {
        activeTab.value = 'records'
    }
})

onMounted(async () => {
    startLoading('Loading DNS Records...', 'Zone Records & Edge Routing')
    await loadData()
    if (activeTab.value === 'security') {
        await loadSecurityData()
    }
    stopLoading(250)
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
                        Zone ID: {{ resolvedCfZoneId }}
                    </p>
                </div>
            </div>
            <div class="ph-right">
                <NuxtLink
                    :to="`/analytics?zoneId=${resolvedCfZoneId}`"
                    class="btn-ref ghost flex items-center gap-1.5"
                    :title="$t('analytics.title')"
                >
                    <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-[var(--green)]" />
                    <span>{{ $t('analytics.analytics_btn') }}</span>
                </NuxtLink>
                <button
                    type="button"
                    class="btn-ref ghost"
                    :disabled="pending || securityLoading"
                    @click="activeTab === 'security' ? loadSecurityData() : loadData()"
                >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': pending || securityLoading }" />
                    <span>{{ $t('common.refresh') }}</span>
                </button>
                <button
                    v-if="activeTab === 'records'"
                    type="button"
                    class="btn-ref primary"
                    @click="isAddModalOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('records.add_record') }}</span>
                </button>
                <button
                    v-else
                    type="button"
                    class="btn-ref primary"
                    @click="isAddIpModalOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('waf.btn_add_ip_rule') }}</span>
                </button>
            </div>
        </section>

        <!-- Zone Tabs matching ref.html -->
        <div v-if="allZones.length > 0" class="zone-tabs overflow-x-auto pb-1 no-scrollbar">
            <NuxtLink
                v-for="z in allZones"
                :key="z.id"
                :to="activeTab === 'security' ? `/zones/${z.cfZoneId}?tab=security` : `/zones/${z.cfZoneId}`"
                class="ztab"
                :class="{ on: z.cfZoneId === resolvedCfZoneId }"
            >
                <UIcon name="i-heroicons-globe-alt" class="w-3.5 h-3.5 opacity-80" />
                <span class="truncate max-w-[140px]">{{ z.name }}</span>
                <span class="zcount">{{ z._count?.records ?? 0 }}</span>
            </NuxtLink>
        </div>

        <!-- Sub Navigation Tabs: DNS Records vs Security & WAF -->
        <div class="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <button
                type="button"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border"
                :class="activeTab === 'records'
                    ? 'bg-[var(--surface2)] text-[var(--green)] border-[var(--green)]/40 shadow-[0_0_12px_rgba(18,224,138,0.15)] ring-1 ring-[var(--green)]/20'
                    : 'text-[var(--text2)] border-transparent hover:text-[var(--text)] hover:bg-[var(--surface2)]'"
                @click="switchTab('records')"
            >
                <UIcon name="i-heroicons-bars-3-bottom-left" class="w-4 h-4" />
                <span>{{ $t('waf.tab_records') }}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--surface)] text-[var(--text3)] border border-[var(--border)]">
                    {{ records.length }}
                </span>
            </button>

            <button
                type="button"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border relative"
                :class="activeTab === 'security'
                    ? 'bg-[var(--surface2)] text-[var(--danger)] border-red-500/40 shadow-[0_0_12px_rgba(251,94,122,0.15)] ring-1 ring-red-500/20'
                    : 'text-[var(--text2)] border-transparent hover:text-[var(--text)] hover:bg-[var(--surface2)]'"
                @click="switchTab('security')"
            >
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
                <span>{{ $t('waf.tab_security') }}</span>
                <span
                    v-if="securitySettings?.isUnderAttack"
                    class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-red-500/20 text-[var(--danger)] border border-red-500/40 animate-pulse"
                >
                    ATTACK
                </span>
                <span
                    v-else-if="accessRules.length > 0"
                    class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--surface)] text-[var(--text3)] border border-[var(--border)]"
                >
                    {{ accessRules.length }}
                </span>
            </button>
        </div>

        <!-- TAB 1: DNS RECORDS -->
        <div v-show="activeTab === 'records'" class="space-y-6">
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

            <!-- Desktop Table (hidden on mobile <768px) -->
            <div class="table-wrap overflow-x-auto hidden md:block">
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
                            <th>{{ $t('records.col_health') }}</th>
                            <th class="ar text-right">{{ $t('common.actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="pending">
                            <tr>
                                <td colspan="9" class="text-center py-16">
                                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
                                    <p class="text-xs text-[var(--text3)]">Loading DNS records from Cloudflare...</p>
                                </td>
                            </tr>
                        </template>
                        <template v-else-if="filteredRecords.length === 0">
                            <tr class="empty-row">
                                <td colspan="9">
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
                                <td>
                                    <div v-if="r.healthCheck?.enabled" class="flex items-center">
                                        <button
                                            type="button"
                                            class="pill"
                                            :class="{
                                                'ok': r.healthCheck.currentStatus === 'HEALTHY',
                                                'warn': r.healthCheck.currentStatus === 'FAILOVER_ACTIVE' || r.healthCheck.currentStatus === 'DEGRADED',
                                                'err': r.healthCheck.currentStatus === 'DOWN'
                                            }"
                                            :title="`Probe: ${r.healthCheck.probeType} ${r.healthCheck.probeTarget || ''}\nLatency: ${r.healthCheck.lastLatencyMs || 0}ms\nStatus: ${r.healthCheck.currentStatus}`"
                                            @click="openHealthModal(r)"
                                        >
                                            <span
                                                class="dot"
                                                :class="{
                                                    'bg-[var(--green)]': r.healthCheck.currentStatus === 'HEALTHY',
                                                    'bg-[var(--amber)] animate-ping': r.healthCheck.currentStatus === 'FAILOVER_ACTIVE',
                                                    'bg-[var(--danger)]': r.healthCheck.currentStatus === 'DOWN'
                                                }"
                                            ></span>
                                            <span>{{ r.healthCheck.currentStatus === 'FAILOVER_ACTIVE' ? 'FAILOVER' : r.healthCheck.currentStatus }}</span>
                                            <span v-if="r.healthCheck.lastLatencyMs" class="opacity-75 text-[8.5px] lowercase">{{ r.healthCheck.lastLatencyMs }}ms</span>
                                        </button>
                                    </div>
                                    <span v-else class="text-xs text-[var(--text3)] opacity-40">—</span>
                                </td>
                                <td class="ar text-right">
                                    <div class="flex items-center justify-end gap-1">
                                        <button
                                            v-if="r.healthCheck?.enabled"
                                            type="button"
                                            class="icon-btn sm"
                                            title="Health & Failover Status"
                                            @click="openHealthModal(r)"
                                        >
                                            <UIcon name="i-heroicons-heart" class="w-3.5 h-3.5 text-[var(--green)]" />
                                        </button>
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

            <!-- Mobile Records Cards List (shown only on mobile < 768px) -->
            <div class="records-mobile-list block md:hidden divide-y divide-[var(--border)]">
                <template v-if="pending">
                    <div class="text-center py-12">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
                        <p class="text-xs text-[var(--text3)]">Loading DNS records from Cloudflare...</p>
                    </div>
                </template>
                <template v-else-if="filteredRecords.length === 0">
                    <div class="empty py-12 text-center flex flex-col items-center justify-center p-4">
                        <UIcon name="i-heroicons-magnifying-glass" class="w-10 h-10 text-[var(--text3)] mb-3" />
                        <div class="font-bold text-sm text-[var(--text)]">No DNS records found</div>
                        <span class="text-xs text-[var(--text3)] mt-1">Try adjusting your filters or search query</span>
                    </div>
                </template>
                <template v-else>
                    <div
                        v-for="r in filteredRecords"
                        :key="r.id"
                        class="record-mobile-card p-4 space-y-3 transition-colors"
                        :class="{ 'bg-[rgba(18,224,138,0.06)] border-l-2 border-l-[var(--green)]': selectedIds.has(r.id), 'hover:bg-[var(--surface2)]': !selectedIds.has(r.id) }"
                    >
                        <!-- Row 1: Checkbox, Badge Type, Name, TTL -->
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <input
                                    type="checkbox"
                                    :checked="selectedIds.has(r.id)"
                                    class="rounded cursor-pointer flex-none mt-0.5"
                                    @change="toggleSelect(r.id)"
                                />
                                <span class="badge-type flex-none" :class="`t-${r.type}`">{{ r.type }}</span>
                                <span class="mono font-bold text-sm text-[var(--text)] truncate" :title="r.name">{{ r.name }}</span>
                                <button
                                    v-if="r.healthCheck?.enabled"
                                    type="button"
                                    class="pill cursor-pointer ml-1 text-[9px] py-0.5 px-2"
                                    :class="{
                                        'ok': r.healthCheck.currentStatus === 'HEALTHY',
                                        'warn': r.healthCheck.currentStatus === 'FAILOVER_ACTIVE' || r.healthCheck.currentStatus === 'DEGRADED',
                                        'err': r.healthCheck.currentStatus === 'DOWN'
                                    }"
                                    @click="openHealthModal(r)"
                                >
                                    <span
                                        class="dot w-1.5 h-1.5"
                                        :class="r.healthCheck.currentStatus === 'FAILOVER_ACTIVE' ? 'bg-[var(--amber)] animate-ping' : 'bg-[var(--green)]'"
                                    ></span>
                                    <span>{{ r.healthCheck.currentStatus === 'FAILOVER_ACTIVE' ? 'FAILOVER' : r.healthCheck.currentStatus }}</span>
                                </button>
                            </div>
                            <span class="mono text-[11px] text-[var(--text3)] flex-none">{{ formatTtl(r.ttl) }}</span>
                        </div>

                        <!-- Row 2: Target / Content with copy button -->
                        <div class="flex items-center justify-between text-xs text-[var(--text2)] bg-[var(--surface2)] px-3 py-1.5 rounded-lg font-mono">
                            <span class="truncate mr-2 text-[12px] text-[var(--cyan)]" :title="r.content">{{ r.content }}</span>
                            <button
                                type="button"
                                class="mini-copy text-[var(--text2)] hover:text-[var(--green)] flex-none"
                                title="Copy content"
                                @click="copyContent(r.content)"
                            >
                                <UIcon name="i-heroicons-clipboard-document" class="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <!-- Row 3: Proxy status, DDNS switch, and Actions -->
                        <div class="flex items-center justify-between pt-1 gap-2 flex-wrap">
                            <div class="flex items-center gap-3">
                                <!-- Proxy Toggle -->
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

                                <!-- DDNS Switch -->
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10.5px] font-bold text-[var(--text3)] uppercase">DDNS</span>
                                    <label class="switch-ref sm">
                                        <input
                                            type="checkbox"
                                            :checked="r.isAutoUpdate"
                                            @change="handleToggleDdns(r)"
                                        />
                                        <span></span>
                                    </label>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center gap-1">
                                <button
                                    v-if="r.healthCheck?.enabled"
                                    type="button"
                                    class="icon-btn sm"
                                    title="Health & Failover Status"
                                    @click="openHealthModal(r)"
                                >
                                    <UIcon name="i-heroicons-heart" class="w-3.5 h-3.5 text-[var(--green)]" />
                                </button>
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
                        </div>
                    </div>
                </template>
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
        </div>
        <!-- END TAB 1: DNS RECORDS -->

        <!-- TAB 2: SECURITY & WAF -->
        <div v-show="activeTab === 'security'" class="space-y-6">
            <!-- Permission Warning Banner if Token Lacks Scopes -->
            <div
                v-if="securityPermissionWarning"
                class="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200 flex items-start gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            >
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div class="flex-1">
                    <div class="font-bold text-amber-300 text-sm">Cloudflare Token Permission Notice</div>
                    <p class="mt-1 text-xs leading-relaxed text-amber-200/90">{{ securityPermissionWarning }}</p>
                    <p class="mt-1 text-[11px] text-amber-300/70">
                        Please update your API Token permissions in the Cloudflare Dashboard: <strong>Zone &gt; Zone Settings (Edit)</strong> and <strong>Zone &gt; Firewall Services (Edit)</strong>.
                    </p>
                </div>
            </div>

            <!-- 1. Security Overview & Under Attack Card -->
            <SecurityOverviewCard
                :settings="securitySettings"
                :loading="securityLoading"
                :updating="securityUpdating"
                @update-level="handleUpdateSecurityLevel"
                @update-general="handleUpdateGeneralSettings"
            />

            <!-- 2. IP & Country Access Rules Table -->
            <SecurityIpAccessRulesTable
                :rules="accessRules"
                :loading="accessRulesLoading"
                :deleting-id="deletingRuleId"
                @add-rule="isAddIpModalOpen = true"
                @delete-rule="handleDeleteIpRule"
            />

            <!-- 3. WAF Custom Rules (Ruleset Engine) -->
            <SecurityWafRulesList
                :rules="wafRules"
                :loading="wafRulesLoading"
                :toggling-id="togglingWafId"
                @toggle-rule="handleToggleWafRule"
            />
        </div>
        <!-- END TAB 2: SECURITY & WAF -->

        <!-- Add IP Rule Modal -->
        <SecurityAddIpRuleModal
            :is-open="isAddIpModalOpen"
            :loading="addIpLoading"
            @close="isAddIpModalOpen = false"
            @submit="handleAddIpRule"
        />

        <!-- Add / Edit Modals -->
        <RecordAddModal
            v-if="isAddModalOpen"
            :cf-zone-id="resolvedCfZoneId"
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

        <!-- Health & Failover Audit Modal -->
        <UModal v-model:open="healthModalOpen" :ui="{ content: 'sm:max-w-xl' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-heart" class="w-5 h-5 text-[var(--green)]" />
                            <div>
                                <h3 class="font-bold text-base text-[var(--text)]">Service Health & Failover Status</h3>
                                <p class="text-xs text-[var(--text3)] mono">{{ healthRecord?.name }}</p>
                            </div>
                        </div>
                        <button type="button" class="icon-btn sm" @click="healthModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <div v-if="healthLoading" class="py-12 text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
                        <p class="text-xs text-[var(--text3)]">Loading probe status and history...</p>
                    </div>

                    <div v-else-if="healthData" class="space-y-4">
                        <!-- Status Banner -->
                        <div
                            class="p-4 rounded-xl border flex items-center justify-between"
                            :class="healthData.currentStatus === 'FAILOVER_ACTIVE' 
                                ? 'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.35)] text-[var(--amber)]'
                                : healthData.currentStatus === 'DOWN'
                                ? 'bg-[rgba(251,94,122,0.1)] border-[rgba(251,94,122,0.35)] text-[var(--danger)]'
                                : 'bg-[rgba(18,224,138,0.1)] border-[rgba(18,224,138,0.35)] text-[var(--green)]'"
                        >
                            <div class="flex items-center gap-3">
                                <span
                                    class="w-3.5 h-3.5 rounded-full"
                                    :class="healthData.currentStatus === 'FAILOVER_ACTIVE' ? 'bg-[var(--amber)] animate-ping' : 'bg-[var(--green)]'"
                                ></span>
                                <div>
                                    <div class="font-bold text-sm uppercase tracking-wide">
                                        {{ healthData.currentStatus === 'FAILOVER_ACTIVE' ? 'FAILOVER ACTIVE (Standby IP Active)' : healthData.currentStatus }}
                                    </div>
                                    <span class="text-xs opacity-85">
                                        {{ healthData.currentStatus === 'FAILOVER_ACTIVE' ? 'Primary service failed. Cloudflare DNS routed to backup IP.' : 'All health checks passing normally.' }}
                                    </span>
                                </div>
                            </div>
                            <span v-if="healthData.lastLatencyMs" class="font-mono text-sm font-bold">
                                ⚡ {{ healthData.lastLatencyMs }}ms
                            </span>
                        </div>

                        <!-- Metrics Grid -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div class="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                                <span class="text-[10px] text-[var(--text3)] uppercase font-bold block">Protocol</span>
                                <b class="font-mono text-[var(--text)]">{{ healthData.probeType }}</b>
                            </div>
                            <div class="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                                <span class="text-[10px] text-[var(--text3)] uppercase font-bold block">Interval</span>
                                <b class="font-mono text-[var(--text)]">{{ healthData.intervalSeconds }}s</b>
                            </div>
                            <div class="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                                <span class="text-[10px] text-[var(--text3)] uppercase font-bold block">Threshold</span>
                                <b class="font-mono text-[var(--text)]">{{ healthData.failureThreshold }} fails</b>
                            </div>
                            <div class="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                                <span class="text-[10px] text-[var(--text3)] uppercase font-bold block">Backup IP</span>
                                <b class="font-mono text-[var(--cyan)] truncate block" :title="healthData.backupIp">{{ healthData.backupIp || 'None' }}</b>
                            </div>
                        </div>

                        <!-- Recent Probe Log History -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                                <span>Recent Probe History</span>
                                <span class="text-[10.5px] font-mono text-[var(--text3)]">
                                    Target: {{ healthData.probeTarget }}
                                </span>
                            </div>

                            <div v-if="!healthData.history || healthData.history.length === 0" class="py-6 text-center text-xs text-[var(--text3)]">
                                No probe checks recorded yet. Next check runs in {{ healthData.intervalSeconds }}s.
                            </div>

                            <div v-else class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                                <div
                                    v-for="log in healthData.history"
                                    :key="log.id"
                                    class="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-between text-xs font-mono"
                                >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="w-2 h-2 rounded-full"
                                            :class="log.status === 'PASS' ? 'bg-[var(--green)]' : 'bg-[var(--danger)]'"
                                        ></span>
                                        <span class="font-bold" :class="log.status === 'PASS' ? 'text-[var(--green)]' : 'text-[var(--danger)]'">
                                            {{ log.status }}
                                        </span>
                                        <span v-if="log.statusCode" class="text-[var(--text3)]">({{ log.statusCode }})</span>
                                        <span v-if="log.errorMessage" class="text-[var(--danger)] truncate max-w-[200px]" :title="log.errorMessage">
                                            {{ log.errorMessage }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-3 text-[11px] text-[var(--text3)]">
                                        <span v-if="log.latencyMs !== undefined">{{ log.latencyMs }}ms</span>
                                        <span>{{ new Date(log.createdAt).toLocaleTimeString() }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Modal footer actions -->
                        <div class="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                            <button
                                type="button"
                                class="btn-ref ghost sm"
                                @click="() => { healthModalOpen = false; editingRecord = { ...healthRecord } }"
                            >
                                <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-[var(--cyan)]" />
                                <span>Edit Health Config</span>
                            </button>
                            <button
                                type="button"
                                class="btn-ref primary sm"
                                @click="healthModalOpen = false"
                            >
                                <span>{{ $t('common.close') }}</span>
                            </button>
                        </div>
                    </div>

                    <div v-else class="py-8 text-center text-xs text-[var(--text3)] space-y-3">
                        <UIcon name="i-heroicons-shield-exclamation" class="w-8 h-8 text-[var(--text3)] mx-auto opacity-40" />
                        <p>No health check configured for this record yet.</p>
                        <button
                            type="button"
                            class="btn-ref primary sm inline-flex items-center gap-1.5"
                            @click="() => { healthModalOpen = false; editingRecord = { ...healthRecord } }"
                        >
                            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                            <span>Configure Health Check</span>
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
