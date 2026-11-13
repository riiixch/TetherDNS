<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const stats = ref<any>(null)
const pending = ref(true)
const copied = ref(false)

const toast = useToast()
const { t } = useI18n()

const loadStats = async () => {
    pending.value = true
    try {
        const res = await $fetch<{ data: any }>('/api/dashboard/stats')
        stats.value = res.data
    } catch {
        /* ignore */
    } finally {
        pending.value = false
    }
}

onMounted(() => {
    loadStats()
})

defineExpose({ refresh: loadStats })

const copyIp = async () => {
    if (!stats.value?.currentIp || stats.value?.currentIp === 'N/A') return
    try {
        await navigator.clipboard.writeText(stats.value.currentIp)
        copied.value = true
        toast.add({ title: t('common.success'), description: t('propagation.expected_ip') + ' ' + stats.value.currentIp, color: 'success' })
        setTimeout(() => {
            copied.value = false
        }, 1500)
    } catch {
        /* fallback */
    }
}

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
    <section class="stats">
        <!-- Accounts -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic green">
                    <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('dashboard.stats_accounts') }}</span>
            </div>
            <div class="stat-num">{{ stats?.totalAccounts ?? 0 }}</div>
            <div class="stat-sub">Cloudflare API</div>
        </div>

        <!-- Zones -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic cyan">
                    <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('dashboard.stats_zones') }}</span>
            </div>
            <div class="stat-num">{{ stats?.totalZones ?? 0 }}</div>
            <div class="stat-sub">Hosted DNS zones</div>
        </div>

        <!-- Records -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic violet">
                    <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('dashboard.stats_records') }}</span>
            </div>
            <div class="stat-num">{{ stats?.totalRecords ?? 0 }}</div>
            <div class="stat-sub">Across {{ stats?.totalZones ?? 0 }} zones</div>
        </div>

        <!-- DDNS -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic amber">
                    <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('dashboard.stats_ddns') }}</span>
            </div>
            <div class="stat-num">{{ stats?.ddnsEnabledCount ?? 0 }}</div>
            <div class="stat-sub">Monitored DDNS</div>
        </div>

        <!-- Current IP with copy button -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic green">
                    <UIcon name="i-heroicons-signal" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('dashboard.stats_current_ip') }}</span>
            </div>
            <div class="stat-ip mono truncate">{{ stats?.currentIp || '127.0.0.1' }}</div>
            <button
                type="button"
                class="stat-sub copy-btn focus:outline-none flex items-center gap-1.5"
                :class="{ copied }"
                @click="copyIp"
            >
                <UIcon :name="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'" class="w-3.5 h-3.5" />
                <span>{{ copied ? 'COPIED' : 'COPY IP' }}</span>
            </button>
        </div>

        <!-- Last Update -->
        <div class="stat card">
            <div class="stat-top">
                <span class="stat-ic cyan">
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                </span>
                <span class="stat-label">{{ $t('dashboard.stats_last_update') }}</span>
            </div>
            <div class="stat-last">
                <span
                    v-if="stats?.lastUpdate"
                    class="pill"
                    :class="stats.lastUpdate.status === 'SUCCESS' ? 'ok' : 'err'"
                >
                    {{ stats.lastUpdate.status }}
                </span>
                <span v-else class="pill ok">STANDBY</span>
                <span v-if="stats?.lastUpdate?.time" class="lu-time">
                    {{ timeAgo(stats.lastUpdate.time) }}
                </span>
            </div>
            <div class="stat-sub">Success Rate {{ stats?.recentSuccessRate ?? 100 }}%</div>
        </div>
    </section>
</template>
