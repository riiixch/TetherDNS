<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DdnsSettings from '../components/settings/DdnsSettings.vue'
import NotificationSettings from '../components/settings/NotificationSettings.vue'
import UserSettings from '../components/settings/UserSettings.vue'
import SecuritySettings from '../components/settings/SecuritySettings.vue'
import ApiTokenSettings from '../components/settings/ApiTokenSettings.vue'

const { t } = useI18n()
useHead({ title: t('settings.title') })
const toast = useToast()

const selectedTab = ref('general')
const tabs = computed(() => [
    { label: t('settings.tab_general'), icon: 'i-heroicons-cog-6-tooth', value: 'general' },
    { label: t('settings.tab_security'), icon: 'i-heroicons-shield-check', value: 'security' },
    { label: t('settings.tab_api'), icon: 'i-heroicons-key', value: 'api' },
    { label: t('settings.tab_notifications'), icon: 'i-heroicons-bell', value: 'notifications' },
    { label: t('settings.tab_users'), icon: 'i-heroicons-users', value: 'users' }
])

const { startLoading, stopLoading, isLoading } = useAppLoading()

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
        if (res.data?.ddns_interval_minutes) {
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
        toast.add({ title: t('common.success'), description: 'Settings saved successfully', color: 'success' })
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
        channels.value = res.data || []
    } catch { /* ignore */ } finally {
        notifPending.value = false
    }
}

const addChannel = async (payload: any) => {
    if (!payload.label) {
        toast.add({ title: t('common.failed'), description: t('settings.err_label'), color: 'error' })
        return
    }

    const config: any = {}
    if (payload.type === 'discord' || payload.type === 'webhook') {
        if (!payload.webhookUrl) {
            toast.add({ title: t('common.failed'), description: t('settings.err_webhook'), color: 'error' })
            throw new Error()
        }
        config.webhookUrl = payload.webhookUrl
        if (payload.botName) config.botName = payload.botName
        if (payload.avatarUrl) config.avatarUrl = payload.avatarUrl
        if (payload.mentionRole) config.mentionRole = payload.mentionRole
    } else if (payload.type === 'telegram') {
        if (!payload.botToken || !payload.chatId) {
            toast.add({ title: t('common.failed'), description: 'Bot Token and Chat ID are required', color: 'error' })
            throw new Error()
        }
        config.botToken = payload.botToken
        config.chatId = payload.chatId
        if (payload.topicId) config.topicId = payload.topicId
        config.silentMode = !!payload.silentMode
    } else if (payload.type === 'email') {
        if (!payload.user || !payload.pass) {
            toast.add({ title: t('common.failed'), description: 'Email address and App Password are required', color: 'error' })
            throw new Error()
        }
        config.provider = payload.provider || 'gmail'
        config.user = payload.user
        config.pass = payload.pass
        config.toAddress = payload.toAddress || payload.user
        config.host = payload.host || 'smtp.gmail.com'
        config.port = Number(payload.port) || 465
        config.fromName = payload.fromName || 'TetherDNS Guardian'
    } else if (payload.type === 'line') {
        if (!payload.lineToken) {
            toast.add({ title: t('common.failed'), description: t('settings.err_line'), color: 'error' })
            throw new Error()
        }
        config.token = payload.lineToken
    }

    try {
        await $fetch('/api/notifications', {
            method: 'POST',
            body: {
                type: payload.type,
                label: payload.label,
                events: payload.events,
                config
            }
        })
        toast.add({ title: t('common.success'), description: t('common.success'), color: 'success' })
        loadChannels()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
        throw e
    }
}

const toggleChannel = async (channel: any) => {
    try {
        await $fetch(`/api/notifications/${channel.id}`, {
            method: 'PATCH',
            body: { enabled: !channel.enabled }
        })
        channel.enabled = !channel.enabled
        toast.add({
            title: t('common.success'),
            description: channel.enabled ? `${channel.label} enabled` : `${channel.label} disabled`,
            color: 'success'
        })
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
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
        users.value = res.data || []
    } catch { /* ignore */ } finally {
        usersPending.value = false
    }
}

const addUser = async (payload: any) => {
    if (!payload.username || !payload.password) {
        toast.add({ title: t('common.failed'), description: t('settings.err_user_pass'), color: 'error' })
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
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

onMounted(async () => {
    startLoading('Loading System Configuration...', t('settings.subtitle') || 'Manage Administrative Access')
    try {
        await Promise.allSettled([
            loadSettings(),
            loadChannels(),
            loadUsers()
        ])
    } finally {
        stopLoading(300)
    }
})
</script>

<template>
    <div
        class="space-y-6 flex flex-col h-full pb-10 transition-opacity duration-300"
        :class="{ 'opacity-0': isLoading, 'opacity-100': !isLoading }"
    >
        <!-- Page Head matching ref.html -->
        <section class="page-head">
            <div class="ph-left">
                <div class="ph-icon">
                    <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-[var(--cyan)]" />
                </div>
                <div>
                    <h1>{{ $t('settings.title') }}</h1>
                    <p class="sub">{{ $t('settings.subtitle_desc') }}</p>
                </div>
            </div>
            <div class="ph-right">
                <span class="saved-auto flex items-center gap-1.5 text-xs text-[var(--green)]">
                    <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                    <span>Synchronized</span>
                </span>
            </div>
        </section>

        <!-- Layout with sidebar & main content -->
        <div class="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            <!-- Sidebar navigation -->
            <aside class="w-full lg:w-64 lg:sticky lg:top-24 shrink-0 space-y-3">
                <div class="settings-sidebar">
                    <nav class="settings-nav-list">
                        <button
                            v-for="tab in tabs"
                            :key="tab.value"
                            type="button"
                            class="settings-nav-item"
                            :class="{ active: selectedTab === tab.value }"
                            @click="selectedTab = tab.value"
                        >
                            <UIcon :name="tab.icon" class="nav-item-icon" />
                            <span class="flex-1">{{ tab.label }}</span>
                            <span class="nav-item-indicator"></span>
                        </button>
                    </nav>
                </div>

                <div class="px-3 py-1">
                    <p class="text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.2em]">
                        {{ $t('settings.core_brand') }}
                    </p>
                </div>
            </aside>

            <!-- Main Tab Content -->
            <main class="flex-1 w-full min-w-0">
                <div class="relative min-h-[400px]">
                    <Transition
                        mode="out-in"
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 -translate-y-1"
                    >
                        <div :key="selectedTab" class="w-full">
                            <DdnsSettings
                                v-if="selectedTab === 'general'"
                                :ddns-interval="ddnsInterval"
                                :loading="settingsLoading"
                                @save="saveSettings"
                            />
                            <SecuritySettings
                                v-else-if="selectedTab === 'security'"
                            />
                            <ApiTokenSettings
                                v-else-if="selectedTab === 'api'"
                            />
                            <NotificationSettings
                                v-else-if="selectedTab === 'notifications'"
                                :channels="channels"
                                :loading="notifPending"
                                @add="addChannel"
                                @delete="deleteChannel"
                                @test="testChannel"
                                @toggle="toggleChannel"
                            />
                            <UserSettings
                                v-else-if="selectedTab === 'users'"
                                :users="users"
                                :loading="usersPending"
                                :current-user="currentUser"
                                @add="addUser"
                                @delete="deleteUser"
                            />
                        </div>
                    </Transition>
                </div>
            </main>
        </div>
    </div>
</template>
