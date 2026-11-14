<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'

const { t } = useI18n()
const props = defineProps<{ record: any }>()
const emit = defineEmits(['close', 'refresh'])
const { updateRecord } = useRecords()
const toast = useToast()

const isOpen = ref(true)
const activeTab = ref<'dns' | 'health'>('dns')

// Record basic fields
const recordType = ref(props.record.type)
const recordName = ref(props.record.name)
const recordContent = ref(props.record.content)
const proxied = ref(props.record.proxied)
const updateToken = ref(props.record.updateToken)
const isLoading = ref(false)
const isTokenLoading = ref(false)
const isConfirmRevokeOpen = ref(false)

// Tunnel & Routing Mode
const routingMode = ref(props.record.routingMode || 'static')
const selectedTunnelId = ref<string>(props.record.tunnelId || '')
const localAddress = ref(props.record.localAddress || 'http://localhost:8080')
const tunnels = ref<any[]>([])

// Health Check & Automatic Failover fields
const healthCheck = ref<any>(props.record.healthCheck || null)
const hcEnabled = ref(props.record.healthCheck?.enabled ?? false)
const hcProbeType = ref(props.record.healthCheck?.probeType || 'HTTP')
const hcProbeTarget = ref(
    props.record.healthCheck?.probeTarget || 
    (props.record.type === 'A' ? `http://${props.record.name}` : `https://${props.record.name}`)
)
const hcExpectedStatus = ref(props.record.healthCheck?.expectedStatus ?? 200)
const hcInterval = ref(props.record.healthCheck?.intervalSeconds ?? 60)
const hcTimeout = ref(props.record.healthCheck?.timeoutSeconds ?? 5)
const hcFailThreshold = ref(props.record.healthCheck?.failureThreshold ?? 3)
const hcPassThreshold = ref(props.record.healthCheck?.successThreshold ?? 2)
const hcBackupIp = ref(props.record.healthCheck?.backupIp || '')
const hcBackupProxied = ref(props.record.healthCheck?.backupProxied ?? true)
const hcAutoFailback = ref(props.record.healthCheck?.autoFailback ?? true)

const probeTesting = ref(false)
const probeTestResult = ref<any>(null)

const typeOptions = computed(() => {
    if (routingMode.value === 'ddns') {
        return [
            { label: 'A', value: 'A' },
            { label: 'AAAA', value: 'AAAA' }
        ]
    }
    return [
        { label: 'A', value: 'A' },
        { label: 'AAAA', value: 'AAAA' },
        { label: 'CNAME', value: 'CNAME' },
        { label: 'MX', value: 'MX' },
        { label: 'TXT', value: 'TXT' },
        { label: 'SRV', value: 'SRV' },
        { label: 'NS', value: 'NS' },
        { label: 'CAA', value: 'CAA' },
    ]
})

const routingModeOptions = [
    { label: 'Static / Manual', value: 'static' },
    { label: 'Auto DDNS', value: 'ddns' },
    { label: 'Cloudflare Tunnel', value: 'tunnel' }
]

const probeTypeOptions = [
    { label: 'HTTP GET', value: 'HTTP' },
    { label: 'HTTPS GET', value: 'HTTPS' },
    { label: 'TCP Port Ping', value: 'TCP' }
]

const showProxied = computed(() => ['A', 'AAAA', 'CNAME'].includes(recordType.value) && routingMode.value !== 'tunnel')
const canHealthCheck = computed(() => ['A', 'AAAA'].includes(recordType.value))

// Fetch tunnels
const fetchTunnels = async () => {
    const accountId = props.record.zone?.accountId
    if (!accountId) return
    try {
        const res = await $fetch<any>(`/api/tunnels?accountId=${accountId}`)
        if (res.success) {
            tunnels.value = res.data
            if (tunnels.value.length > 0 && !selectedTunnelId.value) {
                selectedTunnelId.value = tunnels.value[0].tunnelId
            }
        }
    } catch (e) {
        console.error(e)
    }
}

// Fetch fresh healthcheck
const fetchHealthCheck = async () => {
    try {
        const res = await $fetch<any>(`/api/records/${props.record.id}/healthcheck`)
        if (res.success && res.data) {
            healthCheck.value = res.data
            hcEnabled.value = res.data.enabled
            hcProbeType.value = res.data.probeType
            hcProbeTarget.value = res.data.probeTarget
            hcExpectedStatus.value = res.data.expectedStatus ?? 200
            hcInterval.value = res.data.intervalSeconds
            hcTimeout.value = res.data.timeoutSeconds
            hcFailThreshold.value = res.data.failureThreshold
            hcPassThreshold.value = res.data.successThreshold
            hcBackupIp.value = res.data.backupIp || ''
            hcBackupProxied.value = res.data.backupProxied ?? true
            hcAutoFailback.value = res.data.autoFailback ?? true
        }
    } catch {
        /* fallback to record prop */
    }
}

watch(routingMode, (newVal) => {
    if (newVal === 'tunnel') {
        recordType.value = 'CNAME'
        proxied.value = true
    } else if (newVal === 'ddns') {
        if (recordType.value !== 'A' && recordType.value !== 'AAAA') {
            recordType.value = 'A'
        }
    }
})

const testProbe = async () => {
    if (!hcProbeTarget.value) {
        toast.add({ title: 'Target Required', description: 'Please enter a target URL or host:port', color: 'error' })
        return
    }

    probeTesting.value = true
    probeTestResult.value = null
    try {
        const res = await $fetch<any>(`/api/records/${props.record.id}/healthcheck/test`, {
            method: 'POST',
            body: {
                probeType: hcProbeType.value,
                probeTarget: hcProbeTarget.value,
                expectedStatus: hcExpectedStatus.value,
                timeoutSeconds: hcTimeout.value
            }
        })
        probeTestResult.value = res.data
        if (res.data?.success) {
            toast.add({
                title: 'Probe Succeeded',
                description: `Latency: ${res.data.latencyMs}ms (Status: ${res.data.statusCode || 'OK'})`,
                color: 'success'
            })
        } else {
            toast.add({
                title: 'Probe Failed',
                description: res.data?.errorMessage || 'Target did not respond as expected',
                color: 'error'
            })
        }
    } catch (e: any) {
        probeTestResult.value = { success: false, errorMessage: e.data?.statusMessage || e.message }
        toast.add({ title: 'Probe Test Failed', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        probeTesting.value = false
    }
}

const handleSave = async () => {
    const isTunnel = routingMode.value === 'tunnel'

    if (!recordName.value) {
        toast.add({ title: t('common.failed'), description: 'Record Name is required', color: 'error' })
        return
    }

    if (!isTunnel && !recordContent.value) {
        toast.add({ title: t('common.failed'), description: t('records.err_required'), color: 'error' })
        return
    }

    if (isTunnel && !selectedTunnelId.value) {
        toast.add({ title: t('common.failed'), description: 'Please select a Cloudflare Tunnel', color: 'error' })
        return
    }

    if (hcEnabled.value) {
        if (!hcBackupIp.value) {
            toast.add({ title: t('common.failed'), description: 'Backup IP is required when Failover is enabled', color: 'error' })
            activeTab.value = 'health'
            return
        }
        const trimmedBackup = hcBackupIp.value.trim()
        const isV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedBackup)
        const isV6 = /^[a-fA-F0-9:]+$/.test(trimmedBackup) && trimmedBackup.includes(':')
        if (!isV4 && !isV6) {
            toast.add({
                title: t('common.failed'),
                description: 'Backup IP must be a valid IPv4 or IPv6 address (e.g. 198.51.100.25)',
                color: 'error'
            })
            activeTab.value = 'health'
            return
        }
    }

    isLoading.value = true
    try {
        // 1. Update basic record
        const updatePayload: Record<string, any> = {
            type: recordType.value,
            name: recordName.value,
            content: isTunnel ? '' : recordContent.value,
            proxied: showProxied.value ? proxied.value : true,
            routingMode: routingMode.value,
            tunnelId: isTunnel ? selectedTunnelId.value : null,
            localAddress: isTunnel ? localAddress.value : null
        }

        await updateRecord(props.record.id, updatePayload)

        // 2. Save health check if applicable
        if (canHealthCheck.value) {
            await $fetch(`/api/records/${props.record.id}/healthcheck`, {
                method: 'POST',
                body: {
                    enabled: hcEnabled.value,
                    probeType: hcProbeType.value,
                    probeTarget: hcProbeTarget.value,
                    expectedStatus: Number(hcExpectedStatus.value) || 200,
                    intervalSeconds: Number(hcInterval.value) || 60,
                    timeoutSeconds: Number(hcTimeout.value) || 5,
                    failureThreshold: Number(hcFailThreshold.value) || 3,
                    successThreshold: Number(hcPassThreshold.value) || 2,
                    backupIp: hcBackupIp.value,
                    backupProxied: hcBackupProxied.value,
                    autoFailback: hcAutoFailback.value
                }
            })
        }
        
        toast.add({ title: t('common.success'), description: 'Record updated successfully.', color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('common.failed'),
            description: e.data?.statusMessage || e.message || t('common.err_occurred'),
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

const generateToken = async () => {
    isTokenLoading.value = true
    try {
        const res = await $fetch<{ token: string }>(`/api/records/${props.record.id}/token`, { method: 'POST' })
        updateToken.value = res.token
        toast.add({ title: t('common.success'), description: t('records.api_desc'), color: 'success' })
        emit('refresh')
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        isTokenLoading.value = false
    }
}

const revokeToken = async () => {
    isTokenLoading.value = true
    try {
        await $fetch<any>(`/api/records/${props.record.id}/token`, { method: 'DELETE' as const })
        updateToken.value = null
        toast.add({ title: t('common.success'), color: 'success' })
        emit('refresh')
        isConfirmRevokeOpen.value = false
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        isTokenLoading.value = false
    }
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.add({ title: t('common.success'), color: 'success' })
}

const ddnsUrl = computed(() => {
    if (!updateToken.value) return ''
    const base = import.meta.client ? window.location.origin : ''
    return `${base}/api/ddns/update?token=${updateToken.value}&ip=<YOUR_IP>`
})

const routerUpdateUrl = computed(() => {
    const base = import.meta.client ? window.location.origin : ''
    return `${base}/nic/update?hostname=${props.record.name}&myip=<YOUR_IP>`
})

onMounted(() => {
    fetchTunnels()
    if (canHealthCheck.value) {
        fetchHealthCheck()
    }
})

watch(isOpen, (val) => { if (!val) emit('close') })
</script>

<template>
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-xl' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">
                                {{ $t('records.edit_modal_title') }}
                            </h3>
                            <p class="text-xs text-slate-500 mt-0.5">{{ props.record.name }} ({{ props.record.type }})</p>
                        </div>
                        <UButton
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-x-mark"
                            class="-my-1"
                            @click="() => { isOpen = false }"
                        />
                    </div>
                </template>

                <div class="py-2 space-y-4">
                    <!-- Tab Switcher -->
                    <div class="flex items-center gap-1 p-1 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                        <button
                            type="button"
                            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                            :class="activeTab === 'dns' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'"
                            @click="activeTab = 'dns'"
                        >
                            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-[var(--cyan)]" />
                            <span>DNS & Routing</span>
                        </button>
                        <button
                            v-if="canHealthCheck"
                            type="button"
                            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                            :class="activeTab === 'health' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text3)] hover:text-[var(--text)]'"
                            @click="activeTab = 'health'"
                        >
                            <UIcon name="i-heroicons-heart" class="w-4 h-4 text-[var(--green)]" />
                            <span>Health & Failover</span>
                            <span
                                v-if="hcEnabled"
                                class="w-2 h-2 rounded-full"
                                :class="healthCheck?.currentStatus === 'FAILOVER_ACTIVE' ? 'bg-[var(--amber)] animate-ping' : 'bg-[var(--green)] animate-pulse'"
                            ></span>
                        </button>
                    </div>

                    <form @submit.prevent="handleSave" class="space-y-4">
                        <!-- TAB 1: DNS & Routing -->
                        <div v-show="activeTab === 'dns'" class="space-y-4">
                            <!-- Routing Mode Selector -->
                            <UFormField label="Routing Mode" name="routingMode">
                                <USelect
                                    v-model="routingMode"
                                    :items="routingModeOptions"
                                    value-key="value"
                                    class="w-full"
                                    :ui="{ base: 'rounded-xl h-10 font-bold' }"
                                />
                            </UFormField>

                            <!-- Type (hidden in tunnel mode) -->
                            <UFormField v-if="routingMode !== 'tunnel'" :label="$t('records.type_field')" name="type">
                                <USelect
                                    v-model="recordType"
                                    :items="typeOptions"
                                    value-key="value"
                                    class="w-full"
                                    :ui="{ base: 'rounded-xl h-10 font-bold' }"
                                />
                            </UFormField>

                            <UFormField :label="$t('records.name_field')" name="name">
                                <UInput
                                    v-model="recordName"
                                    class="w-full"
                                    :ui="{ base: 'rounded-xl h-10 tracking-wide' }"
                                />
                            </UFormField>

                            <!-- Tunnel specific settings -->
                            <template v-if="routingMode === 'tunnel'">
                                <UFormField label="Cloudflare Tunnel" name="tunnelId">
                                    <USelect
                                        v-model="selectedTunnelId"
                                        :items="tunnels.map(t => ({ label: t.name, value: t.tunnelId }))"
                                        value-key="value"
                                        class="w-full"
                                        placeholder="Select a Tunnel"
                                        :ui="{ base: 'rounded-xl h-10 font-bold' }"
                                    />
                                </UFormField>

                                <UFormField label="Local Target Address" name="localAddress" help="The local address/port where traffic should be forwarded.">
                                    <UInput
                                        v-model="localAddress"
                                        placeholder="e.g. http://localhost:8080"
                                        class="w-full font-mono"
                                        :ui="{ base: 'rounded-xl h-10' }"
                                    />
                                </UFormField>
                            </template>

                            <!-- Manual/DDNS content input -->
                            <UFormField v-else :label="$t('records.content_field')" name="content">
                                <UInput
                                    v-model="recordContent"
                                    class="w-full font-mono text-sm"
                                    :ui="{ base: 'rounded-xl h-10' }"
                                />
                            </UFormField>

                            <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied" class="pt-1">
                                <USwitch v-model="proxied" color="warning" />
                            </UFormField>

                            <!-- DDNS API URL generation section -->
                            <div
                                v-if="routingMode === 'ddns'"
                                class="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 border-dashed space-y-4"
                            >
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ $t('records.api_url') }}</h3>
                                        <p class="text-[11px] text-slate-500">{{ $t('records.api_desc') }}</p>
                                    </div>
                                </div>

                                <div v-if="updateToken" class="space-y-3">
                                    <!-- Token update endpoint -->
                                    <div>
                                        <span class="text-[10.5px] font-bold text-[var(--text3)] uppercase mb-1 block">TetherDNS Token URL:</span>
                                        <div class="flex gap-2">
                                            <UInput
                                                :model-value="ddnsUrl"
                                                readonly
                                                class="flex-1 font-mono text-[11px] sm:text-xs text-slate-600 dark:text-slate-300"
                                                :ui="{ base: 'rounded-xl bg-slate-50 dark:bg-slate-900' }"
                                            />
                                            <UButton
                                                color="neutral"
                                                variant="soft"
                                                icon="i-heroicons-clipboard-document"
                                                class="rounded-xl shadow-sm shrink-0"
                                                @click="copyToClipboard(ddnsUrl)"
                                            />
                                        </div>
                                    </div>

                                    <!-- Standard Router /nic/update endpoint -->
                                    <div class="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] space-y-1.5">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                                                <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-[var(--cyan)]" />
                                                <span>Router DynDNS v2 / No-IP Emulation</span>
                                            </span>
                                            <span class="badge t-CNAME">/nic/update</span>
                                        </div>
                                        <p class="text-[11px] text-[var(--text3)]">
                                            Compatible with ASUS, MikroTik, pfSense, OpenWrt, and Keenetic DDNS clients:
                                        </p>
                                        <div class="flex gap-2">
                                            <UInput
                                                :model-value="routerUpdateUrl"
                                                readonly
                                                class="flex-1 font-mono text-[10.5px] text-slate-600 dark:text-slate-300"
                                                :ui="{ base: 'rounded-xl bg-slate-50 dark:bg-slate-900' }"
                                            />
                                            <UButton
                                                color="neutral"
                                                variant="soft"
                                                icon="i-heroicons-clipboard-document"
                                                class="rounded-xl shadow-sm shrink-0"
                                                @click="copyToClipboard(routerUpdateUrl)"
                                            />
                                        </div>
                                    </div>

                                    <div class="flex justify-end">
                                        <UButton
                                            color="error"
                                            variant="ghost"
                                            size="xs"
                                            icon="i-heroicons-trash"
                                            class="rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-500/10"
                                            :loading="isTokenLoading"
                                            @click="() => { isConfirmRevokeOpen = true }"
                                        >
                                            {{ $t('records.revoke_token') }}
                                        </UButton>
                                    </div>
                                </div>
                                <UButton
                                    v-else
                                    color="neutral"
                                    variant="soft"
                                    icon="i-heroicons-key"
                                    :loading="isTokenLoading"
                                    class="rounded-xl font-bold w-full justify-center h-10 shadow-sm border border-slate-200 dark:border-slate-700"
                                    @click="generateToken"
                                >
                                    {{ $t('records.generate_url') }}
                                </UButton>
                            </div>
                        </div>

                        <!-- TAB 2: Health Check & Failover -->
                        <div v-show="activeTab === 'health'" class="space-y-4">
                            <!-- Toggle Card -->
                            <div class="p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-between">
                                <div>
                                    <div class="text-xs font-bold text-[var(--text)] flex items-center gap-2">
                                        <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-[var(--green)]" />
                                        <span>Active Health Check & Automatic Failover</span>
                                    </div>
                                    <p class="text-[11px] text-[var(--text3)] mt-0.5">
                                        Monitors uptime via automated probes and switches Cloudflare DNS to backup IP if primary goes down.
                                    </p>
                                </div>
                                <USwitch v-model="hcEnabled" color="primary" />
                            </div>

                            <!-- Live Health State Banner -->
                            <div
                                v-if="healthCheck"
                                class="p-3 rounded-xl border flex items-center justify-between text-xs font-mono"
                                :class="healthCheck.currentStatus === 'FAILOVER_ACTIVE' 
                                    ? 'bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.3)] text-[var(--amber)]'
                                    : healthCheck.currentStatus === 'DOWN'
                                    ? 'bg-[rgba(251,94,122,0.08)] border-[rgba(251,94,122,0.3)] text-[var(--danger)]'
                                    : 'bg-[rgba(18,224,138,0.08)] border-[rgba(18,224,138,0.3)] text-[var(--green)]'"
                            >
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full" :class="healthCheck.currentStatus === 'FAILOVER_ACTIVE' ? 'bg-[var(--amber)] animate-ping' : 'bg-[var(--green)]'"></span>
                                    <span class="font-bold uppercase tracking-wider">
                                        Status: {{ healthCheck.currentStatus || 'HEALTHY' }}
                                    </span>
                                </div>
                                <div class="flex items-center gap-3 text-[11px]">
                                    <span v-if="healthCheck.lastLatencyMs">⚡ {{ healthCheck.lastLatencyMs }}ms</span>
                                    <span v-if="healthCheck.lastCheckAt">Checked: {{ new Date(healthCheck.lastCheckAt).toLocaleTimeString() }}</span>
                                </div>
                            </div>

                            <div v-if="hcEnabled" class="space-y-4 pt-1">
                                <!-- Probe Settings -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <UFormField label="Probe Protocol" name="probeType">
                                        <USelect
                                            v-model="hcProbeType"
                                            :items="probeTypeOptions"
                                            value-key="value"
                                            class="w-full"
                                            :ui="{ base: 'rounded-xl h-10' }"
                                        />
                                    </UFormField>

                                    <UFormField
                                        v-if="hcProbeType === 'HTTP' || hcProbeType === 'HTTPS'"
                                        label="Expected Status"
                                        name="expectedStatus"
                                    >
                                        <UInput
                                            v-model="hcExpectedStatus"
                                            type="number"
                                            class="w-full font-mono"
                                            placeholder="200"
                                            :ui="{ base: 'rounded-xl h-10' }"
                                        />
                                    </UFormField>
                                </div>

                                <UFormField
                                    label="Probe Target"
                                    name="probeTarget"
                                    :help="hcProbeType === 'TCP' ? 'Host:Port (e.g. 192.168.1.100:8080)' : 'Full URL (e.g. https://my-server.com/health)'"
                                >
                                    <div class="flex gap-2">
                                        <UInput
                                            v-model="hcProbeTarget"
                                            class="flex-1 font-mono text-xs"
                                            placeholder="https://example.com/health"
                                            :ui="{ base: 'rounded-xl h-10' }"
                                        />
                                        <UButton
                                            type="button"
                                            color="neutral"
                                            variant="soft"
                                            :loading="probeTesting"
                                            class="rounded-xl px-3 font-semibold text-xs shrink-0"
                                            @click="testProbe"
                                        >
                                            <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-[var(--cyan)]" />
                                            <span>Test</span>
                                        </UButton>
                                    </div>
                                </UFormField>

                                <!-- Test Probe Output Alert -->
                                <div
                                    v-if="probeTestResult"
                                    class="p-2.5 rounded-xl text-xs flex items-center justify-between border"
                                    :class="probeTestResult.success ? 'bg-[rgba(18,224,138,0.06)] border-[rgba(18,224,138,0.25)] text-[var(--green)]' : 'bg-[rgba(251,94,122,0.06)] border-[rgba(251,94,122,0.25)] text-[var(--danger)]'"
                                >
                                    <span class="flex items-center gap-1.5 font-bold">
                                        <UIcon :name="probeTestResult.success ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" class="w-4 h-4" />
                                        <span>{{ probeTestResult.success ? 'Probe Connected Successfully' : 'Probe Failed' }}</span>
                                    </span>
                                    <span class="font-mono text-[11px]">
                                        {{ probeTestResult.success ? `${probeTestResult.latencyMs}ms (HTTP ${probeTestResult.statusCode || 200})` : probeTestResult.errorMessage }}
                                    </span>
                                </div>

                                <!-- Interval & Thresholds Grid -->
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <UFormField label="Interval (sec)" name="interval">
                                        <UInput v-model="hcInterval" type="number" class="w-full font-mono text-xs" :ui="{ base: 'rounded-xl h-9' }" />
                                    </UFormField>
                                    <UFormField label="Timeout (sec)" name="timeout">
                                        <UInput v-model="hcTimeout" type="number" class="w-full font-mono text-xs" :ui="{ base: 'rounded-xl h-9' }" />
                                    </UFormField>
                                    <UFormField label="Fail Threshold" name="failThreshold">
                                        <UInput v-model="hcFailThreshold" type="number" class="w-full font-mono text-xs" :ui="{ base: 'rounded-xl h-9' }" />
                                    </UFormField>
                                    <UFormField label="Pass Threshold" name="passThreshold">
                                        <UInput v-model="hcPassThreshold" type="number" class="w-full font-mono text-xs" :ui="{ base: 'rounded-xl h-9' }" />
                                    </UFormField>
                                </div>

                                <!-- Failover Settings Section -->
                                <div class="p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                                            <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4 text-[var(--amber)]" />
                                            <span>Failover Routing Configuration</span>
                                        </span>
                                    </div>

                                    <UFormField
                                        label="Failover Backup IP Address"
                                        name="backupIp"
                                        help="Traffic switches to this standby IP / maintenance page if primary service fails."
                                        required
                                    >
                                        <UInput
                                            v-model="hcBackupIp"
                                            placeholder="e.g. 198.51.100.25 or Standby Server IP"
                                            class="w-full font-mono text-xs"
                                            :ui="{ base: 'rounded-xl h-10' }"
                                        />
                                    </UFormField>

                                    <div class="flex items-center justify-between pt-1">
                                        <div class="text-xs">
                                            <span class="font-bold text-[var(--text)] block">Proxy Backup via Cloudflare</span>
                                            <span class="text-[11px] text-[var(--text3)]">Keep orange-cloud proxy active on failover</span>
                                        </div>
                                        <USwitch v-model="hcBackupProxied" color="warning" />
                                    </div>

                                    <div class="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                                        <div class="text-xs">
                                            <span class="font-bold text-[var(--text)] block">Automatic Failback</span>
                                            <span class="text-[11px] text-[var(--text3)]">Revert back to primary IP when service is restored</span>
                                        </div>
                                        <USwitch v-model="hcAutoFailback" color="primary" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer buttons -->
                        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                            <UButton
                                color="neutral"
                                variant="ghost"
                                class="rounded-xl font-bold"
                                @click="() => { isOpen = false }"
                            >
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton
                                type="submit"
                                color="primary"
                                :loading="isLoading"
                                class="rounded-xl font-bold px-6 shadow-sm"
                            >
                                {{ $t('common.save') }}
                            </UButton>
                        </div>
                    </form>
                </div>
            </UCard>
        </template>
    </UModal>

    <!-- Revoke Confirmation Modal -->
    <UModal v-model:open="isConfirmRevokeOpen" :ui="{ content: 'sm:max-w-sm' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-bold text-red-600 dark:text-red-400">
                            {{ $t('records.revoke_token') }}
                        </h3>
                        <UButton
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-x-mark"
                            class="-my-1"
                            @click="() => { isConfirmRevokeOpen = false }"
                        />
                    </div>
                </template>
                <div class="py-2">
                    <p class="text-sm text-slate-600 dark:text-slate-300">
                        {{ $t('records.revoke_warning') }}
                    </p>
                    <div class="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <UButton
                            color="neutral"
                            variant="ghost"
                            class="rounded-xl font-bold"
                            @click="() => { isConfirmRevokeOpen = false }"
                        >
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton
                            color="error"
                            variant="solid"
                            :loading="isTokenLoading"
                            class="rounded-xl font-bold px-6 shadow-sm"
                            @click="revokeToken"
                        >
                            {{ $t('records.revoke_token') }}
                        </UButton>
                    </div>
                </div>
            </UCard>
        </template>
    </UModal>
</template>
