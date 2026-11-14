<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

const { t } = useI18n()
const { startLoading, stopLoading } = useAppLoading()
const toast = useToast()

// State
const logs = ref<any[]>([])
const pending = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const totalPages = ref(1)
const activeCategory = ref('all')
const searchQuery = ref('')

const categories = [
    { key: 'all', label: 'All' },
    { key: 'security', label: 'Security' },
    { key: 'record', label: 'Records' },
    { key: 'account', label: 'Accounts' },
    { key: 'system', label: 'System' },
    { key: 'network', label: 'Network' }
]

const getCatFromAction = (action: string) => {
    const act = (action || '').toUpperCase()
    if (act.includes('SECURITY') || act.includes('WAF') || act.includes('ATTACK')) return 'security'
    if (act.includes('RECORD') || act.includes('ZONE') || act.includes('DDNS') || act.includes('PROXY')) return 'record'
    if (act.includes('ACCOUNT') || act.includes('USER') || act.includes('AUTH') || act.includes('LOGIN')) return 'account'
    if (act.includes('IP') || act.includes('TUNNEL')) return 'network'
    return 'system'
}

const getCatIcon = (cat: string) => {
    switch (cat) {
        case 'security': return 'i-heroicons-shield-exclamation'
        case 'record': return 'i-heroicons-rectangle-stack'
        case 'account': return 'i-heroicons-user-group'
        case 'network': return 'i-heroicons-signal'
        default: return 'i-heroicons-cog-6-tooth'
    }
}

const formatAction = (act: string) => {
    if (!act) return 'performed an action on'
    const a = act.toUpperCase()
    if (a === 'UPDATE_RECORD') return 'updated'
    if (a === 'CREATE_RECORD') return 'created'
    if (a === 'DELETE_RECORD') return 'deleted'
    if (a === 'TOGGLE_DDNS') return 'toggled DDNS on'
    if (a === 'TOGGLE_PROXY') return 'toggled proxy on'
    return a.toLowerCase().replace(/_/g, ' ')
}

const formatTarget = (target: string) => {
    if (!target) return ''
    return target.replace(/^Record:\s*/i, '')
}

const getDetailSummary = (rawDetails: any) => {
    if (!rawDetails) return null
    let obj = rawDetails
    if (typeof rawDetails === 'string') {
        try {
            obj = JSON.parse(rawDetails)
        } catch {
            return { text: rawDetails }
        }
    }
    const d = obj?.updateDetails || obj
    if (!d || typeof d !== 'object') {
        return typeof d === 'string' ? { text: d } : null
    }
    return {
        ip: d.content || d.ip || d.newIp || null,
        proxied: d.proxied !== undefined ? d.proxied : undefined,
        ddns: d.isAutoUpdate || d.routingMode === 'ddns' || false,
        text: d.message || d.label || (d.zone ? `Zone: ${d.zone}` : null)
    }
}

// Actions
const loadLogs = async () => {
    pending.value = true
    try {
        const query: any = { page: page.value, limit: limit.value }
        if (searchQuery.value) query.search = searchQuery.value

        const res = await $fetch<{ data: any[], pagination: any }>('/api/audit', { query })
        logs.value = res.data || []
        total.value = res.pagination?.total || 0
        totalPages.value = res.pagination?.totalPages || 1
    } catch (e: any) {
        toast.add({ title: t('audit.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const filteredLogs = computed(() => {
    if (activeCategory.value === 'all') return logs.value
    return logs.value.filter(l => getCatFromAction(l.action) === activeCategory.value)
})

const goPage = (p: number) => {
    if (p < 1 || p > totalPages.value) return
    page.value = p
    loadLogs()
}

// Watchers
watch(searchQuery, () => {
    page.value = 1
    loadLogs()
})

onMounted(async () => {
    startLoading(t('audit.loading') || 'Loading Audit Logs...', t('audit.subtitle') || 'Security & Audit Logs')
    await loadLogs()
    stopLoading(250)
})

const timeAgo = (dateStr: string) => {
    if (!dateStr) return '-'
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.years_ago')
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.months_ago')
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.days_ago')
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.hours_ago')
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' ' + t('times.mins_ago')
    return Math.floor(seconds) + ' ' + t('times.seconds_ago')
}
</script>

<template>
    <div class="space-y-6">
        <!-- Page Head matching ref.html -->
        <section class="page-head">
            <div class="ph-left">
                <div class="ph-icon">
                    <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-[var(--green)]" />
                </div>
                <div>
                    <h1>{{ $t('audit.title') }}</h1>
                    <p class="sub">{{ $t('audit.subtitle') }}</p>
                </div>
            </div>
        </section>

        <!-- Category filter chips matching ref.html -->
        <div class="filter-chips flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
                v-for="cat in categories"
                :key="cat.key"
                type="button"
                class="fchip flex-none"
                :class="{ on: activeCategory === cat.key }"
                @click="activeCategory = cat.key"
            >
                {{ cat.label }}
            </button>
        </div>

        <!-- Main Card -->
        <div class="card toolbar-card overflow-hidden">
            <!-- Search toolbar -->
            <div class="toolbar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div class="search w-full sm:max-w-xs">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)] flex-none" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search audit actions, actors, or targets..."
                        autocomplete="off"
                    />
                </div>
                <div class="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <span class="chip green font-mono text-xs">
                        {{ total }} Audit Entries
                    </span>
                </div>
            </div>

            <!-- Audit Items List -->
            <div class="au-list divide-y divide-[var(--border)] overflow-hidden">
                <template v-if="pending">
                    <div class="p-16 text-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
                        <p class="text-xs text-[var(--text3)]">Loading audit records...</p>
                    </div>
                </template>
                <template v-else-if="filteredLogs.length === 0">
                    <div class="empty py-16 text-center flex flex-col items-center justify-center">
                        <UIcon name="i-heroicons-shield-check" class="w-10 h-10 text-[var(--text3)] mb-3" />
                        <div class="font-bold text-sm text-[var(--text)]">No audit records found</div>
                        <span class="text-xs text-[var(--text3)] mt-1">Actions taken across TetherDNS will be logged here</span>
                    </div>
                </template>
                <template v-else>
                    <div
                        v-for="a in filteredLogs"
                        :key="a.id"
                        class="au-item flex items-start gap-3 p-3.5 sm:p-4 hover:bg-[var(--surface2)] transition-colors overflow-hidden"
                    >
                        <span class="au-ic flex-none mt-0.5" :class="getCatFromAction(a.action)">
                            <UIcon :name="getCatIcon(getCatFromAction(a.action))" class="w-4 h-4" />
                        </span>
                        <div class="au-main flex-1 min-w-0 space-y-1.5 overflow-hidden">
                            <div class="au-text text-xs text-[var(--text)] leading-relaxed break-words">
                                <span class="font-bold text-[var(--text)]">{{ a.user?.username || 'admin' }}</span>
                                <span class="mx-1 text-[var(--text2)]">{{ formatAction(a.action) }}</span>
                                <span class="mono font-bold text-[var(--cyan)] break-all">{{ formatTarget(a.target) }}</span>
                            </div>

                            <!-- Human-readable detail chips -->
                            <div v-if="getDetailSummary(a.details)" class="flex items-center gap-1.5 flex-wrap text-[11px] font-mono pt-0.5">
                                <span v-if="getDetailSummary(a.details)?.ip" class="chip green text-[10.5px]">
                                    IP: {{ getDetailSummary(a.details)?.ip }}
                                </span>
                                <span v-if="getDetailSummary(a.details)?.proxied !== undefined" class="chip text-[10.5px]">
                                    {{ getDetailSummary(a.details)?.proxied ? 'Proxied' : 'DNS Only' }}
                                </span>
                                <span v-if="getDetailSummary(a.details)?.ddns" class="chip amber text-[10.5px]">
                                    DDNS
                                </span>
                                <span v-if="getDetailSummary(a.details)?.text" class="chip text-[10.5px]">
                                    {{ getDetailSummary(a.details)?.text }}
                                </span>
                            </div>

                            <!-- Timestamp -->
                            <div class="au-time text-[10.5px] text-[var(--text3)] flex items-center gap-1 font-mono pt-0.5">
                                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 opacity-60" />
                                <span>{{ timeAgo(a.createdAt) }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Table Foot with Pagination -->
            <div class="table-foot flex items-center justify-between p-4 border-t border-[var(--border)] text-xs text-[var(--text3)]">
                <span>Page {{ page }} of {{ totalPages || 1 }}</span>
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="icon-btn sm"
                        :disabled="page <= 1"
                        @click="goPage(page - 1)"
                    >
                        <UIcon name="i-heroicons-chevron-left" class="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        class="icon-btn sm"
                        :disabled="page >= totalPages"
                        @click="goPage(page + 1)"
                    >
                        <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
