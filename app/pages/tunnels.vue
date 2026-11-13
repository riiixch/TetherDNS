<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const { t } = useI18n()
useHead({ title: 'Cloudflare Tunnels | TetherDNS' })

definePageMeta({ layout: 'default' })

const toast = useToast()
const accounts = ref<any[]>([])
const selectedAccountId = ref<number | null>(null)
const tunnels = ref<any[]>([])
const loading = ref(false)
const actionLoading = ref<string | null>(null)

// Create Tunnel Modal
const isCreateModalOpen = ref(false)
const newTunnelName = ref('')
const creatingTunnel = ref(false)

// Logs Modal
const isLogsModalOpen = ref(false)
const selectedTunnelLogs = ref<string>('')
const selectedTunnelName = ref<string>('')

// Fetch accounts
const fetchAccounts = async () => {
    try {
        const res = await $fetch<any>('/api/accounts')
        if (res.success) {
            accounts.value = res.data || []
            if (accounts.value.length > 0 && !selectedAccountId.value) {
                selectedAccountId.value = accounts.value[0].id
            }
        }
    } catch (e: any) {
        toast.add({ title: 'Error fetching accounts', description: e.message, color: 'error' })
    }
}

// Fetch tunnels
const fetchTunnels = async () => {
    if (!selectedAccountId.value) return
    loading.value = true
    try {
        const res = await $fetch<any>(`/api/tunnels?accountId=${selectedAccountId.value}`)
        if (res.success) {
            tunnels.value = res.data || []
        }
    } catch (e: any) {
        toast.add({ title: 'Error fetching tunnels', description: e.message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(selectedAccountId, () => {
    fetchTunnels()
})

// Toggle tunnel status (daemon)
const toggleTunnel = async (tunnel: any) => {
    const isRunning = tunnel.status === 'active'
    const action = isRunning ? 'stop' : 'start'
    actionLoading.value = tunnel.tunnelId
    
    try {
        const res = await $fetch<any>('/api/tunnels/toggle', {
            method: 'POST',
            body: {
                tunnelId: tunnel.tunnelId,
                action
            }
        })
        if (res.success) {
            toast.add({
                title: action === 'start' ? 'Tunnel Started' : 'Tunnel Stopped',
                description: `Successfully requested local daemon for "${tunnel.name}" to ${action}.`,
                color: 'success'
            })
            fetchTunnels()
        }
    } catch (e: any) {
        toast.add({ title: 'Action Failed', description: e.message, color: 'error' })
    } finally {
        actionLoading.value = null
    }
}

// Create tunnel
const createTunnel = async () => {
    if (!selectedAccountId.value || !newTunnelName.value.trim()) return
    creatingTunnel.value = true
    try {
        const res = await $fetch<any>('/api/tunnels', {
            method: 'POST',
            body: {
                accountId: selectedAccountId.value,
                name: newTunnelName.value.trim()
            }
        })
        if (res.success) {
            toast.add({ title: 'Success', description: 'Cloudflare Tunnel created successfully.', color: 'success' })
            newTunnelName.value = ''
            isCreateModalOpen.value = false
            fetchTunnels()
        }
    } catch (e: any) {
        toast.add({ title: 'Failed to create tunnel', description: e.message, color: 'error' })
    } finally {
        creatingTunnel.value = false
    }
}

// Delete tunnel
const deleteTunnel = async (tunnelId: string) => {
    if (!confirm('Are you sure you want to delete this Tunnel? This will delete it on Cloudflare and local database, and stop the local runner.')) return
    actionLoading.value = tunnelId
    try {
        const res = await $fetch<any>(`/api/tunnels/${tunnelId}`, {
            method: 'DELETE'
        })
        if (res.success) {
            toast.add({ title: 'Deleted', description: 'Tunnel removed successfully.', color: 'success' })
            fetchTunnels()
        }
    } catch (e: any) {
        toast.add({ title: 'Delete failed', description: e.message, color: 'error' })
    } finally {
        actionLoading.value = null
    }
}

// View logs
const showLogs = (tunnel: any) => {
    selectedTunnelName.value = tunnel.name
    if (tunnel.connections) {
        try {
            const parsed = JSON.parse(tunnel.connections)
            selectedTunnelLogs.value = parsed.lastMessage || 'No connection events logged yet.'
        } catch {
            selectedTunnelLogs.value = tunnel.connections
        }
    } else {
        selectedTunnelLogs.value = 'No connection details. Make sure the tunnel runner is running locally.'
    }
    isLogsModalOpen.value = true
}

onMounted(() => {
    fetchAccounts()
})
</script>

<template>
    <div class="space-y-6 flex flex-col h-full pb-10">
        <!-- Page Head matching ref.html -->
        <section class="page-head">
            <div class="ph-left">
                <div class="ph-icon">
                    <UIcon name="i-heroicons-key" class="w-6 h-6 text-[var(--violet)]" />
                </div>
                <div>
                    <h1>{{ $t('nav.tunnels') || 'Cloudflare Tunnels' }}</h1>
                    <p class="sub">
                        Encrypted Zero-Trust outbound edge tunnels without open public ports
                    </p>
                </div>
            </div>
            
            <div class="ph-right flex flex-wrap items-center gap-2">
                <!-- Account Selector -->
                <select
                    v-if="accounts.length > 0"
                    v-model="selectedAccountId"
                    class="input select max-w-[200px]"
                >
                    <option v-for="a in accounts" :key="a.id" :value="a.id">
                        {{ a.label }} ({{ a.email }})
                    </option>
                </select>

                <!-- Create Button -->
                <button
                    v-if="selectedAccountId"
                    type="button"
                    class="btn-ref primary"
                    @click="isCreateModalOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>Create Tunnel</span>
                </button>
            </div>
        </section>

        <!-- No accounts state -->
        <div v-if="accounts.length === 0 && !loading" class="card card-ref p-8 text-center flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-2xl bg-[rgba(251,191,36,0.1)] text-[var(--amber)] flex items-center justify-center mb-3">
                <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
            </div>
            <h3 class="font-bold text-base text-[var(--text)] mb-1">No Cloudflare Accounts Found</h3>
            <p class="text-xs text-[var(--text3)] max-w-sm mb-4">
                You need to link a Cloudflare Account first before deploying edge Tunnels.
            </p>
            <NuxtLink to="/accounts" class="btn-ref primary">
                <UIcon name="i-heroicons-link" class="w-4 h-4" />
                <span>Link Cloudflare Account</span>
            </NuxtLink>
        </div>

        <!-- List of Tunnels -->
        <div v-else class="w-full">
            <div v-if="loading" class="py-16 text-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--violet)] mx-auto mb-2" />
                <p class="text-xs text-[var(--text3)]">Loading Cloudflare tunnels...</p>
            </div>
            
            <div v-else-if="tunnels.length === 0" class="card card-ref p-12 text-center flex flex-col items-center justify-center">
                <UIcon name="i-heroicons-cloud" class="w-12 h-12 text-[var(--text3)] mb-3" />
                <h3 class="font-bold text-base text-[var(--text)] mb-1">No Tunnels Found</h3>
                <p class="text-xs text-[var(--text3)] max-w-sm mb-4">
                    Create a new Tunnel to start routing local applications and services securely.
                </p>
                <button type="button" class="btn-ref primary" @click="isCreateModalOpen = true">
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>Create Tunnel</span>
                </button>
            </div>

            <!-- Tunnels Grid matching ref.html -->
            <div v-else class="tun-grid">
                <div
                    v-for="tunnel in tunnels"
                    :key="tunnel.tunnelId"
                    class="card tun-card flex flex-col justify-between"
                >
                    <div class="space-y-4">
                        <div class="tun-top">
                            <div class="min-w-0">
                                <div class="tun-name truncate" :title="tunnel.name">{{ tunnel.name }}</div>
                                <div class="tun-id select-all">{{ tunnel.tunnelId }}</div>
                            </div>
                            <span class="pill" :class="tunnel.status === 'active' ? 'ok' : 'err'">
                                <span class="dot" :class="tunnel.status === 'active' ? 'ok' : 'failed'"></span>
                                {{ tunnel.status === 'active' ? 'RUNNING' : 'STOPPED' }}
                            </span>
                        </div>

                        <!-- Sparkline graphic matching ref.html -->
                        <div class="py-1">
                            <svg class="w-full h-8" viewBox="0 0 100 34" preserveAspectRatio="none">
                                <polyline
                                    :points="tunnel.status === 'active' ? '0,28 15,20 30,24 45,12 60,16 75,8 90,14 100,6' : '0,30 20,30 40,30 60,30 80,30 100,30'"
                                    fill="none"
                                    :stroke="tunnel.status === 'active' ? 'var(--green)' : 'var(--danger)'"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    opacity="0.85"
                                />
                            </svg>
                        </div>

                        <div class="tun-meta">
                            <div>
                                <small>CONNECTIONS</small>
                                <b>{{ tunnel.status === 'active' ? '4 active' : '0' }}</b>
                            </div>
                            <div>
                                <small>UPTIME</small>
                                <b>{{ tunnel.status === 'active' ? '99.98%' : '0.00%' }}</b>
                            </div>
                            <div>
                                <small>CREATED</small>
                                <b class="text-xs">{{ new Date(tunnel.createdAt).toLocaleDateString() }}</b>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Footer -->
                    <div class="tun-foot pt-4 border-t border-[var(--border)] mt-4">
                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                class="btn-ref ghost sm flex items-center gap-1.5"
                                :disabled="actionLoading === tunnel.tunnelId"
                                @click="toggleTunnel(tunnel)"
                            >
                                <UIcon
                                    :name="tunnel.status === 'active' ? 'i-heroicons-pause' : 'i-heroicons-play'"
                                    class="w-3.5 h-3.5"
                                    :class="tunnel.status === 'active' ? 'text-[var(--amber)]' : 'text-[var(--green)]'"
                                />
                                <span>{{ tunnel.status === 'active' ? 'Stop Daemon' : 'Start Daemon' }}</span>
                            </button>
                            <button
                                type="button"
                                class="btn-ref ghost sm flex items-center gap-1.5"
                                @click="showLogs(tunnel)"
                            >
                                <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5 text-[var(--cyan)]" />
                                <span>Logs</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            class="icon-btn sm danger"
                            title="Delete Tunnel"
                            :disabled="actionLoading === tunnel.tunnelId"
                            @click="deleteTunnel(tunnel.tunnelId)"
                        >
                            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Tunnel Modal -->
        <UModal v-model:open="isCreateModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--text)] flex items-center gap-2">
                            <UIcon name="i-heroicons-key" class="w-5 h-5 text-[var(--violet)]" />
                            <span>Create Cloudflare Tunnel</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isCreateModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        Create an encrypted cloudflared tunnel on Cloudflare edge. TetherDNS will manage the token and credentials automatically.
                    </p>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            Tunnel Name
                        </label>
                        <input
                            v-model="newTunnelName"
                            type="text"
                            placeholder="e.g. homelab-gateway"
                            class="input mono w-full"
                            autofocus
                        />
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="isCreateModalOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="button"
                            class="btn-ref primary"
                            :disabled="creatingTunnel"
                            @click="createTunnel"
                        >
                            <UIcon v-if="creatingTunnel" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                            <span>Create Tunnel</span>
                        </button>
                    </div>
                </div>
            </template>
        </UModal>

        <!-- Logs Modal -->
        <UModal v-model:open="isLogsModalOpen" :ui="{ content: 'sm:max-w-xl' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-[var(--cyan)]" />
                            <h3 class="font-bold text-base text-[var(--text)]">{{ selectedTunnelName }} - Logs</h3>
                        </div>
                        <button type="button" class="icon-btn sm" @click="isLogsModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <pre class="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)] font-mono text-xs text-[var(--text2)] overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed">{{ selectedTunnelLogs }}</pre>

                    <div class="flex justify-end pt-2">
                        <button type="button" class="btn-ref ghost" @click="isLogsModalOpen = false">
                            Close
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
