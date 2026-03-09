<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DdnsSettings from '../components/settings/DdnsSettings.vue'
import NotificationSettings from '../components/settings/NotificationSettings.vue'
import UserSettings from '../components/settings/UserSettings.vue'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const toast = useToast()

// Settings
const ddnsInterval = ref('5')
const settingsLoading = ref(false)

// Notifications
const channels = ref<any[]>([])
const notifPending = ref(true)

// Users
const users = ref<any[]>([])
const usersPending = ref(true)
const { user: currentUser } = useAuth()

const loadSettings = async () => {
    try {
        const res = await $fetch<{ data: Record<string, string> }>('/api/settings')
        if (res.data.ddns_interval_minutes) {
            ddnsInterval.value = res.data.ddns_interval_minutes
        }
    } catch { /* use defaults */ }
}

const saveSettings = async (newInterval: string) => {
    settingsLoading.value = true
    try {
        await $fetch('/api/settings', {
            method: 'PUT',
            body: { ddns_interval_minutes: newInterval }
        })
        ddnsInterval.value = newInterval
        toast.add({ title: t('common.success'), description: t('common.success'), color: 'success' })
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
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

const addChannel = async (payload: any) => {
    if (!payload.label) {
        toast.add({ title: t('common.failed'), description: 'Label is required', color: 'error' })
        return
    }

    const config: any = {}
    if (payload.type === 'discord') {
        if (!payload.webhookUrl) { toast.add({ title: t('common.failed'), description: 'Webhook URL is required', color: 'error' }); throw new Error() }
        config.webhookUrl = payload.webhookUrl
    } else if (payload.type === 'line') {
        if (!payload.lineToken) { toast.add({ title: t('common.failed'), description: 'LINE Token is required', color: 'error' }); throw new Error() }
        config.token = payload.lineToken
    }

    try {
        await $fetch('/api/notifications', { method: 'POST', body: { type: payload.type, label: payload.label, config } })
        toast.add({ title: t('common.success'), description: t('common.success'), color: 'success' })
        loadChannels()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
        throw e
    }
}

const deleteChannel = async (id: number) => {
    try {
        await $fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        toast.add({ title: t('common.success'), color: 'success' })
        loadChannels()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

const testChannel = async (channel: any) => {
    try {
        await $fetch(`/api/notifications/${channel.id}/test`, { method: 'POST' })
        toast.add({ title: t('common.success'), color: 'success' })
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
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

const addUser = async (payload: any) => {
    if (!payload.username || !payload.password) {
        toast.add({ title: t('common.failed'), description: 'Username and password are required', color: 'error' })
        throw new Error()
    }

    try {
        await $fetch('/api/users', { method: 'POST', body: payload })
        toast.add({ title: t('common.success'), color: 'success' })
        loadUsers()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
        throw e
    }
}

const deleteUser = async (id: number) => {
    try {
        await $fetch(`/api/users/${id}`, { method: 'DELETE' })
        toast.add({ title: t('common.success'), color: 'success' })
        loadUsers()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    }
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
            <h1 class="text-2xl font-bold">{{ $t('settings.title') }}</h1>
            <p class="text-gray-400 mt-1">{{ $t('settings.subtitle') }}</p>
        </div>

        <DdnsSettings :ddns-interval="ddnsInterval" :loading="settingsLoading" @save="saveSettings" />

        <NotificationSettings :channels="channels" :loading="notifPending" @add="addChannel" @delete="deleteChannel"
            @test="testChannel" />

        <UserSettings :users="users" :loading="usersPending" :current-user="currentUser" @add="addUser"
            @delete="deleteUser" />
    </div>
</template>
