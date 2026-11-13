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
const activeCategory = ref('all')
const searchQuery = ref('')

const categories = [
    { key: 'all', label: 'All' },
    { key: 'record', label: 'Records' },
    { key: 'account', label: 'Accounts' },
    { key: 'system', label: 'System' },
    { key: 'network', label: 'Network' }
]

const getCatFromAction = (action: string) => {
    const act = (action || '').toUpperCase()
    if (act.includes('RECORD') || act.includes('ZONE') || act.includes('DDNS') || act.includes('PROXY')) return 'record'
    if (act.includes('ACCOUNT') || act.includes('USER') || act.includes('AUTH') || act.includes('LOGIN')) return 'account'
    if (act.includes('IP') || act.includes('TUNNEL')) return 'network'
    return 'system'
}

const getCatIcon = (cat: string) => {
    switch (cat) {
        case 'record': return 'i-heroicons-rectangle-stack'
        case 'account': return 'i-heroicons-user-group'
        case 'network': return 'i-heroicons-signal'
        default: return 'i-heroicons-cog-6-tooth'
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

onMounted(() => loadLogs())

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
        <div class="filter-chips flex items-center gap-2 overflow-x-auto pb-1">
            <button
                v-for="cat in categories"
                :key="cat.key"
                type="button"
                class="fchip"
                :class="{ on: activeCategory === cat.key }"
                @click="activeCategory = cat.key"
            >
                {{ cat.label }}
            </button>
        </div>

        <!-- Main Card -->
        <div class="card toolbar-card">
            <!-- Search toolbar -->
            <div class="toolbar">
                <div class="search">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)]" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search audit actions, actors, or targets..."
                        autocomplete="off"
                    />
                </div>
                <div class="spacer"></div>
                <span class="chip green font-mono text-xs">
                    {{ total }} Audit Entries
                </span>
            </div>

            <!-- Audit Items List -->
            <div class="au-list divide-y divide-[var(--border)]">
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
                        class="au-item flex items-center gap-3 p-4 hover:bg-[var(--surface2)] transition-colors"
                    >
                        <span class="au-ic flex-none" :class="getCatFromAction(a.action)">
                            <UIcon :name="getCatIcon(getCatFromAction(a.action))" class="w-4 h-4" />
                        </span>
                        <div class="au-main flex-1 min-w-0">
                            <span class="au-text text-xs text-[var(--text)]">
                                <b>{{ a.user?.username || 'admin' }}</b>
                                <span class="mx-1 text-[var(--text2)]">{{ a.action.toLowerCase().replace(/_/g, ' ') }}</span>
                                <span v-if="a.target" class="mono font-semibold text-[var(--cyan)]">{{ a.target }}</span>
                                <span v-if="a.details" class="text-[var(--text3)] ml-1">({{ a.details }})</span>
                            </span>
                        </div>
                        <span class="au-time text-[11px] text-[var(--text3)] whitespace-nowrap flex-none">
                            {{ timeAgo(a.createdAt) }}
                        </span>
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
