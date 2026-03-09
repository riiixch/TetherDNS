<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DdnsSettings from '../components/settings/DdnsSettings.vue'
import NotificationSettings from '../components/settings/NotificationSettings.vue'
import UserSettings from '../components/settings/UserSettings.vue'
import SecuritySettings from '../components/settings/SecuritySettings.vue'
import ApiTokenSettings from '../components/settings/ApiTokenSettings.vue'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const toast = useToast()

const selectedTab = ref('general')
const tabs = computed(() => [
    { label: t('settings.tab_general'), icon: 'i-heroicons-cog-6-tooth', value: 'general' },
    { label: t('settings.tab_security'), icon: 'i-heroicons-shield-check', value: 'security' },
    { label: t('settings.tab_api'), icon: 'i-heroicons-key', value: 'api' },
    { label: t('settings.tab_notifications'), icon: 'i-heroicons-bell', value: 'notifications' },
    { label: t('settings.tab_users'), icon: 'i-heroicons-users', value: 'users' }
])

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
        toast.add({ title: t('common.failed'), description: t('settings.err_label'), color: 'error' })
        return
    }

    const config: any = {}
    if (payload.type === 'discord' || payload.type === 'webhook') {
        if (!payload.webhookUrl) { toast.add({ title: t('common.failed'), description: t('settings.err_webhook'), color: 'error' }); throw new Error() }
        config.webhookUrl = payload.webhookUrl
    } else if (payload.type === 'line') {
        if (!payload.lineToken) { toast.add({ title: t('common.failed'), description: t('settings.err_line'), color: 'error' }); throw new Error() }
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
            <h1 class="text-3xl font-black tracking-tight text-black dark:text-white flex items-center gap-3 font-sans">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-indigo-500" />
                {{ $t('audit.title') }}
            </h1>
            <p class="text-slate-400 mt-1 font-medium font-sans">{{ $t('audit.subtitle') }}</p>
        </div>

        <div class="flex flex-col lg:flex-row gap-8 items-start">
            <!-- Sidebar Navigation -->
            <aside class="w-full lg:w-72 lg:sticky lg:top-24 shrink-0 space-y-4">
                <div
                    class="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-3xl p-4 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800/50">
                    <div class="px-3 py-2 mb-2">
                        <h2
                            class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-sans">
                            {{ $t('settings.title') }}</h2>
                    </div>

                    <nav class="space-y-1">
                        <button v-for="tab in tabs" :key="tab.value" @click="selectedTab = tab.value" :class="[
                            'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 font-sans group',
                            selectedTab === tab.value
                                ? 'bg-primary-500/10 text-primary-500 shadow-sm ring-1 ring-primary-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                            <UIcon :name="tab.icon"
                                :class="['w-5 h-5 transition-transform duration-300 group-hover:scale-110', selectedTab === tab.value ? 'text-primary-500' : 'text-slate-400']" />
                            {{ tab.label }}
                        </button>
                    </nav>
                </div>

                <!-- Footer-like credit in sidebar -->
                <div class="px-6 py-2">
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">TetherDNS
                    </p>
                </div>
            </aside>

            <!-- Main Content Area -->
            <main class="flex-1 w-full min-w-0">
                <div class="relative min-h-[500px]">
                    <Transition mode="out-in"
                        enter-active-class="transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-200 ease-[cubic-bezier(0.4,0,1,1)]"
                        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
                        <div :key="selectedTab" class="w-full">
                            <DdnsSettings v-if="selectedTab === 'general'" :ddns-interval="ddnsInterval"
                                :loading="settingsLoading" @save="saveSettings" />

                            <SecuritySettings v-if="selectedTab === 'security'" />

                            <ApiTokenSettings v-if="selectedTab === 'api'" />

                            <NotificationSettings v-if="selectedTab === 'notifications'" :channels="channels"
                                :loading="notifPending" @add="addChannel" @delete="deleteChannel" @test="testChannel" />

                            <UserSettings v-if="selectedTab === 'users'" :users="users" :loading="usersPending"
                                :current-user="currentUser" @add="addUser" @delete="deleteUser" />
                        </div>
                    </Transition>
                </div>
            </main>
        </div>
    </div>
</template>
