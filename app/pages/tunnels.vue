<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const { t } = useI18n()
useHead({ title: 'Cloudflare Tunnels - TetherDNS' })

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
            accounts.value = res.data
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
            tunnels.value = res.data
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
        selectedTunnelLogs.value = 'No connections details. Make sure the tunnel is running locally.'
    }
    isLogsModalOpen.value = true
}

onMounted(() => {
    fetchAccounts()
})
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                        <UIcon name="i-heroicons-key-solid" class="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                    </div>
                    Cloudflare Tunnels
                </h1>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Manage Cloudflare Zero Trust Tunnels and run local daemons directly in TetherDNS.
                </p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3">
                <!-- Account Selector -->
                <div v-if="accounts.length > 0" class="min-w-[200px]">
                    <USelect
                        v-model="selectedAccountId"
                        :options="accounts.map(a => ({ label: a.label, value: a.id }))"
                        placeholder="Select Account"
                        class="w-full"
                    />
                </div>
                <!-- Create Button -->
                <UButton
                    v-if="selectedAccountId"
                    icon="i-heroicons-plus"
                    class="rounded-xl font-bold shadow-md shadow-primary-500/10"
                    @click="() => { isCreateModalOpen = true }"
                >
                    Create Tunnel
                </UButton>
            </div>
        </div>

        <!-- No accounts state -->
        <div v-if="accounts.length === 0 && !loading" class="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <UIcon name="i-heroicons-user-group" class="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">No Cloudflare Accounts Found</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">You need to link a Cloudflare Account first before using Tunnels.</p>
            <UButton to="/accounts" color="primary">Manage Accounts</UButton>
        </div>

        <!-- List of Tunnels -->
        <div v-else class="w-full">
            <div v-if="loading" class="space-y-4">
                <div v-for="n in 3" :key="n" class="h-20 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
            </div>
            
            <div v-else-if="tunnels.length === 0" class="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <UIcon name="i-heroicons-cloud" class="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">No Tunnels Found</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a new Tunnel to start routing local services securely.</p>
                <UButton icon="i-heroicons-plus" @click="() => { isCreateModalOpen = true }">Create Tunnel</UButton>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="tunnel in tunnels" :key="tunnel.tunnelId" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div class="p-6 space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug">{{ tunnel.name }}</h3>
                                <p class="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1 select-all">{{ tunnel.tunnelId }}</p>
                            </div>
                            
                            <!-- Status Badge -->
                            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                 :class="tunnel.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
                                <span class="w-1.5 h-1.5 rounded-full" :class="tunnel.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'" />
                                {{ tunnel.status === 'active' ? 'RUNNING' : 'STOPPED' }}
                            </div>
                        </div>

                        <!-- Info/Token -->
                        <div class="space-y-2 pt-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-400">Created At:</span>
                                <span class="font-medium text-slate-600 dark:text-slate-300">{{ new Date(tunnel.createdAt).toLocaleDateString() }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Footer -->
                    <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                        <!-- Toggle Switch -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Daemon Run</span>
                            <USwitch
                                :model-value="tunnel.status === 'active'"
                                :disabled="actionLoading === tunnel.tunnelId"
                                @update:model-value="toggleTunnel(tunnel)"
                            />
                        </div>

                        <div class="flex items-center gap-2">
                            <UButton
                                icon="i-heroicons-document-text"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                class="rounded-lg"
                                @click="showLogs(tunnel)"
                            >
                                Logs
                            </UButton>
                            <UButton
                                icon="i-heroicons-trash"
                                color="error"
                                variant="ghost"
                                size="sm"
                                class="rounded-lg"
                                :loading="actionLoading === tunnel.tunnelId"
                                @click="deleteTunnel(tunnel.tunnelId)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Tunnel Modal -->
        <UModal v-model:open="isCreateModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white">Create Cloudflare Tunnel</h3>
                                <p class="text-xs text-slate-500 mt-0.5">Create a cloud-managed Zero Trust Tunnel.</p>
                            </div>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="() => { isCreateModalOpen = false }" />
                        </div>
                    </template>

                    <div class="space-y-5 py-2">
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            This will create a new cloud-managed Zero Trust Tunnel on your Cloudflare account. The local daemon runner will be initialized on TetherDNS.
                        </p>
                        <UFormField label="Tunnel Name" name="name">
                            <UInput
                                v-model="newTunnelName"
                                placeholder="e.g. homeserver-tunnel"
                                autofocus
                                class="w-full"
                                :ui="{ root: 'rounded-xl h-10' }"
                            />
                        </UFormField>

                        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                            <UButton color="neutral" variant="ghost" class="rounded-xl font-bold" @click="() => { isCreateModalOpen = false }">Cancel</UButton>
                            <UButton color="primary" :loading="creatingTunnel" :disabled="!newTunnelName.trim()" class="rounded-xl font-bold px-6 shadow-sm" @click="createTunnel">Create</UButton>
                        </div>
                    </div>
                </UCard>
            </template>
        </UModal>

        <!-- Logs / Details Modal -->
        <UModal v-model:open="isLogsModalOpen" :ui="{ content: 'sm:max-w-lg' }">
            <template #content>
                <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white">Daemon Connection Logs</h3>
                                <p class="text-xs text-slate-500 mt-0.5">{{ selectedTunnelName }}</p>
                            </div>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="() => { isLogsModalOpen = false }" />
                        </div>
                    </template>

                    <div class="space-y-4 py-2">
                        <div class="bg-slate-900 dark:bg-black text-slate-100 p-4 rounded-xl font-mono text-xs overflow-auto max-h-[300px] whitespace-pre-wrap border border-slate-800 shadow-inner">
                            {{ selectedTunnelLogs }}
                        </div>
                        <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                            <UButton color="neutral" variant="soft" class="rounded-xl font-bold" @click="() => { isLogsModalOpen = false }">Close</UButton>
                        </div>
                    </div>
                </UCard>
            </template>
        </UModal>
    </div>
</template>
