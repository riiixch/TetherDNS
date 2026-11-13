<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

const { fetchLogs } = useLogs()
const toast = useToast()
const { t } = useI18n()

// State
const logs = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const pending = ref(true)
const searchQuery = ref('')
const statusFilter = ref('ALL')

// Actions
const loadData = async () => {
    pending.value = true
    try {
        const res = await fetchLogs({
            page: pagination.value.page,
            limit: pagination.value.limit,
            status: statusFilter.value === 'ALL' ? undefined : (statusFilter.value || undefined),
            search: searchQuery.value || undefined
        })
        logs.value = res.data || []
        pagination.value = res.pagination
    } catch (e: any) {
        toast.add({ title: t('logs.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

// Watchers
watch([searchQuery, statusFilter], () => {
    pagination.value.page = 1
    loadData()
})

const goPage = (p: number) => {
    if (p < 1 || p > pagination.value.totalPages) return
    pagination.value.page = p
    loadData()
}

const exportCSV = () => {
    const rows = [['timestamp', 'hostname', 'from', 'to', 'status', 'message']]
    logs.value.forEach(l => {
        rows.push([
            new Date(l.createdAt).toISOString(),
            l.record?.name || 'unknown',
            l.oldIp || '',
            l.newIp || '',
            l.status,
            l.message || ''
        ])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tetherdns-updates.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.add({ title: t('common.success'), description: 'CSV exported successfully', color: 'success' })
}

const formatTime = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
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
                    <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-[var(--cyan)]" />
                </div>
                <div>
                    <h1>{{ $t('logs.title') }}</h1>
                    <p class="sub">{{ $t('logs.subtitle') }}</p>
                </div>
            </div>
            <div class="ph-right">
                <button
                    type="button"
                    class="btn-ref ghost"
                    :disabled="logs.length === 0"
                    @click="exportCSV"
                >
                    <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
                    <span>Export CSV</span>
                </button>
            </div>
        </section>

        <!-- Main Card -->
        <div class="card toolbar-card">
            <!-- Toolbar -->
            <div class="toolbar flex flex-wrap items-center gap-3">
                <div class="search">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)]" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search hostname or IP..."
                        autocomplete="off"
                    />
                </div>

                <select v-model="statusFilter" class="input select max-w-[140px]">
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                </select>

                <div class="spacer"></div>
                <span class="chip green font-mono text-xs">
                    {{ pagination.total }} Events
                </span>
            </div>

            <!-- Table -->
            <div class="table-wrap overflow-x-auto">
                <table class="rtable w-full">
                    <thead>
                        <tr>
                            <th>{{ $t('logs.col_time') }}</th>
                            <th>{{ $t('logs.col_record') }}</th>
                            <th>IP Transition</th>
                            <th>{{ $t('logs.col_status') }}</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="pending">
                            <tr>
                                <td colspan="5" class="text-center py-16">
                                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--cyan)] mx-auto mb-2" />
                                    <p class="text-xs text-[var(--text3)]">Loading update logs...</p>
                                </td>
                            </tr>
                        </template>
                        <template v-else-if="logs.length === 0">
                            <tr class="empty-row">
                                <td colspan="5">
                                    <div class="empty py-16 text-center flex flex-col items-center justify-center">
                                        <UIcon name="i-heroicons-clock" class="w-10 h-10 text-[var(--text3)] mb-3" />
                                        <div class="font-bold text-sm text-[var(--text)]">No update logs recorded</div>
                                        <span class="text-xs text-[var(--text3)] mt-1">Logs will appear here once DDNS mutations occur</span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="log in logs" :key="log.id">
                                <td class="utime">
                                    <span class="font-mono font-semibold">{{ formatTime(log.createdAt) }}</span>
                                    <span class="u-date">{{ formatDate(log.createdAt) }}</span>
                                </td>
                                <td class="mono font-semibold text-[var(--text)]">
                                    {{ log.record?.name || 'Unknown' }}
                                </td>
                                <td>
                                    <div class="u-change mono inline-flex items-center gap-1.5">
                                        <span class="opacity-70">{{ log.oldIp || '—' }}</span>
                                        <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-[var(--text3)]" />
                                        <b :class="log.status === 'SUCCESS' ? 'text-[var(--green)]' : 'text-[var(--danger)]'">
                                            {{ log.newIp || '—' }}
                                        </b>
                                    </div>
                                </td>
                                <td>
                                    <span class="pill" :class="log.status === 'SUCCESS' ? 'ok' : 'err'">
                                        <span class="dot" :class="log.status === 'SUCCESS' ? 'ok' : 'failed'"></span>
                                        {{ log.status }}
                                    </span>
                                </td>
                                <td>
                                    <span class="text-xs text-[var(--text3)] truncate max-w-xs block" :title="log.message">
                                        {{ log.message || 'Auto DDNS sync' }}
                                    </span>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Pagination Footer -->
            <div class="table-foot flex items-center justify-between p-4 border-t border-[var(--border)] text-xs text-[var(--text3)]">
                <span>Page {{ pagination.page }} of {{ pagination.totalPages || 1 }}</span>
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="icon-btn sm"
                        :disabled="pagination.page <= 1"
                        @click="goPage(pagination.page - 1)"
                    >
                        <UIcon name="i-heroicons-chevron-left" class="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        class="icon-btn sm"
                        :disabled="pagination.page >= pagination.totalPages"
                        @click="goPage(pagination.page + 1)"
                    >
                        <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
