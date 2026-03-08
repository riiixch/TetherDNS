<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// Settings
const ddnsInterval = ref('5')
const settingsLoading = ref(false)

// Notifications
const channels = ref<any[]>([])
const notifPending = ref(true)
const isAddNotifOpen = ref(false)
const notifType = ref('discord')
const notifLabel = ref('')
const notifWebhookUrl = ref('')
const notifLineToken = ref('')
const notifLoading = ref(false)

const notifColumns: any[] = [
    { accessorKey: 'label', header: 'Label' },
    { id: 'type', header: 'Type' },
    { id: 'enabled', header: 'Status' },
    { id: 'actions', header: '' },
]

// Users
const users = ref<any[]>([])
const usersPending = ref(true)
const isAddUserOpen = ref(false)
const newUserPayload = ref({ username: '', password: '' })
const userLoading = ref(false)
const { user: currentUser } = useAuth()

const userColumns: any[] = [
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'createdAt', header: 'Created At' },
    { id: 'actions', header: '' },
]

const loadSettings = async () => {
    try {
        const res = await $fetch<{ data: Record<string, string> }>('/api/settings')
        if (res.data.ddns_interval_minutes) {
            ddnsInterval.value = res.data.ddns_interval_minutes
        }
    } catch { /* use defaults */ }
}

const saveSettings = async () => {
    settingsLoading.value = true
    try {
        await $fetch('/api/settings', {
            method: 'PUT',
            body: { ddns_interval_minutes: ddnsInterval.value }
        })
        toast.add({ title: 'Settings saved', description: `DDNS interval set to ${ddnsInterval.value} minutes. Takes effect on next cycle.`, color: 'success' })
    } catch (e: any) {
        toast.add({ title: 'Error', description: e.message, color: 'error' })
    } finally {
        settingsLoading.value = false
    }
}

const loadChannels = async () => {
    notifPending.value = true
    try {
        const res = await $fetch<{ data: any[] }>('/api/notifications')
        channels.value = res.data
    } catch { /* ignore */ } finally {
        notifPending.value = false
    }
}

const addChannel = async () => {
    if (!notifLabel.value) {
        toast.add({ title: 'Error', description: 'Label is required', color: 'error' })
        return
    }

    const config: any = {}
    if (notifType.value === 'discord') {
        if (!notifWebhookUrl.value) { toast.add({ title: 'Error', description: 'Webhook URL is required', color: 'error' }); return }
        config.webhookUrl = notifWebhookUrl.value
    } else if (notifType.value === 'line') {
        if (!notifLineToken.value) { toast.add({ title: 'Error', description: 'LINE Token is required', color: 'error' }); return }
        config.token = notifLineToken.value
    }

    notifLoading.value = true
    try {
        await $fetch('/api/notifications', { method: 'POST', body: { type: notifType.value, label: notifLabel.value, config } })
        toast.add({ title: 'Success', description: 'Notification channel added', color: 'success' })
        isAddNotifOpen.value = false
        notifLabel.value = ''
        notifWebhookUrl.value = ''
        notifLineToken.value = ''
        loadChannels()
    } catch (e: any) {
        toast.add({ title: 'Error', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        notifLoading.value = false
    }
}

const deleteChannel = async (id: number) => {
    try {
        await $fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        toast.add({ title: 'Deleted', color: 'success' })
        loadChannels()
    } catch (e: any) {
        toast.add({ title: 'Error', description: e.message, color: 'error' })
    }
}

const testChannel = async (channel: any) => {
    try {
        await $fetch(`/api/notifications/${channel.id}/test`, { method: 'POST' })
        toast.add({ title: 'Test sent!', description: `Check your ${channel.type} for the test notification.`, color: 'success' })
    } catch (e: any) {
        toast.add({ title: 'Test failed', description: e.data?.statusMessage || e.message, color: 'error' })
    }
}

const loadUsers = async () => {
    usersPending.value = true
    try {
        const res = await $fetch<{ data: any[] }>('/api/users')
        users.value = res.data
    } catch { /* ignore */ } finally {
        usersPending.value = false
    }
}

const addUser = async () => {
    if (!newUserPayload.value.username || !newUserPayload.value.password) {
        toast.add({ title: 'Error', description: 'Username and password are required', color: 'error' })
        return
    }

    userLoading.value = true
    try {
        await $fetch('/api/users', { method: 'POST', body: newUserPayload.value })
        toast.add({ title: 'Success', description: 'User created', color: 'success' })
        isAddUserOpen.value = false
        newUserPayload.value = { username: '', password: '' }
        loadUsers()
    } catch (e: any) {
        toast.add({ title: 'Error', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        userLoading.value = false
    }
}

const deleteUser = async (id: number) => {
    try {
        await $fetch(`/api/users/${id}`, { method: 'DELETE' })
        toast.add({ title: 'Deleted', color: 'success' })
        loadUsers()
    } catch (e: any) {
        toast.add({ title: 'Error', description: e.data?.statusMessage || e.message, color: 'error' })
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH')
}

onMounted(() => {
    loadSettings()
    loadChannels()
    loadUsers()
})
</script>

<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold">Settings</h1>
            <p class="text-gray-400 mt-1">Configure DDNS interval and notification preferences</p>
        </div>

        <!-- DDNS Settings -->
        <UCard>
            <template #header>
                <h2 class="text-lg font-semibold">DDNS Configuration</h2>
            </template>
            <form @submit.prevent="saveSettings" class="space-y-4">
                <UFormField label="DDNS Check Interval" name="interval">
                    <USelect v-model="ddnsInterval"
                        :items="[{ label: '1 minute', value: '1' }, { label: '5 minutes', value: '5' }, { label: '10 minutes', value: '10' }, { label: '15 minutes', value: '15' }, { label: '30 minutes', value: '30' }, { label: '60 minutes', value: '60' }]"
                        value-key="value" class="w-48" />
                    <p class="text-xs text-gray-400 mt-1">How often the system checks for IP changes</p>
                </UFormField>
                <UButton type="submit" color="primary" :loading="settingsLoading">Save Settings</UButton>
            </form>
        </UCard>

        <!-- Notifications -->
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-semibold">Notifications</h2>
                        <p class="text-sm text-gray-400">Get notified when IP changes or DDNS update fails</p>
                    </div>
                    <UButton icon="i-heroicons-plus" color="primary" @click="isAddNotifOpen = true">
                        Add Channel
                    </UButton>
                </div>
            </template>

            <UTable :data="channels" :columns="notifColumns" :loading="notifPending">
                <template #type-cell="{ row }">
                    <UBadge :color="row.original.type === 'discord' ? 'info' : 'success'" variant="subtle">
                        {{ row.original.type === 'discord' ? '🎮 Discord' : '💬 LINE' }}
                    </UBadge>
                </template>
                <template #enabled-cell="{ row }">
                    <UBadge :color="row.original.enabled ? 'success' : 'neutral'" variant="subtle">
                        {{ row.original.enabled ? 'Active' : 'Disabled' }}
                    </UBadge>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-1">
                        <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-bell-alert"
                            @click="testChannel(row.original)">Test</UButton>
                        <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                            @click="deleteChannel(row.original.id)" />
                    </div>
                </template>
            </UTable>
        </UCard>

        <!-- Add Notification Modal -->
        <UModal v-model:open="isAddNotifOpen" title="Add Notification Channel"
            description="Configure where to receive notifications">
            <template #body>
                <form @submit.prevent="addChannel" class="space-y-4">
                    <UFormField label="Type" name="type">
                        <USelect v-model="notifType"
                            :items="[{ label: '🎮 Discord Webhook', value: 'discord' }, { label: '💬 LINE Notify', value: 'line' }]"
                            value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField label="Label" name="label">
                        <UInput v-model="notifLabel" placeholder="e.g. My Discord Server" class="w-full" />
                    </UFormField>

                    <UFormField v-if="notifType === 'discord'" label="Webhook URL" name="webhookUrl">
                        <UInput v-model="notifWebhookUrl" placeholder="https://discord.com/api/webhooks/..."
                            class="w-full" />
                    </UFormField>

                    <UFormField v-if="notifType === 'line'" label="LINE Notify Token" name="lineToken">
                        <UInput v-model="notifLineToken" type="password" placeholder="Your LINE Notify token"
                            class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isAddNotifOpen = false">Cancel</UButton>
                        <UButton type="submit" color="primary" :loading="notifLoading">Add Channel</UButton>
                    </div>
                </form>
            </template>
        </UModal>

        <!-- User Management -->
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-semibold">User Management</h2>
                        <p class="text-sm text-gray-400">Manage who has access to the DDNS system</p>
                    </div>
                    <UButton icon="i-heroicons-plus" color="primary" @click="isAddUserOpen = true">
                        Add User
                    </UButton>
                </div>
            </template>

            <UTable :data="users" :columns="userColumns" :loading="usersPending">
                <template #username-cell="{ row }">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-200">{{ row.original.username }}</span>
                        <UBadge v-if="currentUser?.id === row.original.id" color="primary" variant="subtle" size="sm">
                            You</UBadge>
                    </div>
                </template>
                <template #createdAt-cell="{ row }">
                    <span class="text-gray-400 text-sm">{{ formatDate(row.original.createdAt) }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end">
                        <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                            :disabled="currentUser?.id === row.original.id" @click="deleteUser(row.original.id)" />
                    </div>
                </template>
            </UTable>
        </UCard>

        <!-- Add User Modal -->
        <UModal v-model:open="isAddUserOpen" title="Create New User"
            description="Grant access to another administrator">
            <template #body>
                <form @submit.prevent="addUser" class="space-y-4">
                    <UFormField label="Username" name="username">
                        <UInput v-model="newUserPayload.username" placeholder="Username" class="w-full" />
                    </UFormField>

                    <UFormField label="Password" name="password">
                        <UInput v-model="newUserPayload.password" type="password" placeholder="Password"
                            class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isAddUserOpen = false">Cancel</UButton>
                        <UButton type="submit" color="primary" :loading="userLoading">Create User</UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </div>
</template>
