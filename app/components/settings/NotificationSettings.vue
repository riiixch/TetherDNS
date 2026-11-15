<script setup lang="ts">
import { ref, computed } from 'vue'

const { t } = useI18n()

defineProps<{
    channels: any[]
    loading: boolean
}>()

const emit = defineEmits(['add', 'delete', 'test', 'toggle'])

const isAddOpen = ref(false)
const type = ref<'discord' | 'telegram' | 'email' | 'line'>('discord')
const label = ref('')

// Discord fields
const webhookUrl = ref('')
const botName = ref('TetherDNS Guardian')
const avatarUrl = ref('')
const mentionRole = ref('')

// Telegram fields
const botToken = ref('')
const chatId = ref('')
const topicId = ref('')
const telegramSilent = ref(false)

// Email fields
const emailProvider = ref<'gmail' | 'custom'>('gmail')
const emailUser = ref('')
const emailPass = ref('')
const emailTo = ref('')
const emailHost = ref('smtp.gmail.com')
const emailPort = ref(465)
const emailFromName = ref('TetherDNS Alert')

// Event subscriptions
const selectedEvents = ref<string[]>(['DDNS', 'FAILOVER', 'TUNNEL', 'SECURITY'])

const isAdding = ref(false)

const eventOptions = [
    { key: 'DDNS', label: 'DDNS IP Changes', icon: 'i-heroicons-arrow-path' },
    { key: 'FAILOVER', label: 'Health Failover & Recovery', icon: 'i-heroicons-shield-exclamation' },
    { key: 'TUNNEL', label: 'Tunnel Status Changes', icon: 'i-heroicons-key' },
    { key: 'SECURITY', label: 'Security & Admin Alerts', icon: 'i-heroicons-lock-closed' }
]

const toggleEvent = (key: string) => {
    if (selectedEvents.value.includes(key)) {
        selectedEvents.value = selectedEvents.value.filter(k => k !== key)
    } else {
        selectedEvents.value.push(key)
    }
}

const add = async () => {
    isAdding.value = true
    try {
        const payload: any = {
            type: type.value,
            label: label.value || `${type.value.toUpperCase()} Alerts`,
            events: selectedEvents.value,
            // Channel specific
            webhookUrl: webhookUrl.value,
            botName: botName.value,
            avatarUrl: avatarUrl.value,
            mentionRole: mentionRole.value,
            botToken: botToken.value,
            chatId: chatId.value,
            topicId: topicId.value,
            silentMode: telegramSilent.value,
            provider: emailProvider.value,
            user: emailUser.value,
            pass: emailPass.value,
            toAddress: emailTo.value || emailUser.value,
            host: emailHost.value,
            port: emailPort.value,
            fromName: emailFromName.value
        }

        await emit('add', payload)
        isAddOpen.value = false
        // Reset
        label.value = ''
        webhookUrl.value = ''
        botToken.value = ''
        chatId.value = ''
        topicId.value = ''
        emailUser.value = ''
        emailPass.value = ''
        emailTo.value = ''
    } finally {
        isAdding.value = false
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="card set-card overflow-hidden">
            <div class="card-head flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                    <div class="card-title">
                        <UIcon name="i-heroicons-bell" class="w-4 h-4 text-[var(--cyan)]" />
                        <span>{{ $t('settings.notif_title') }}</span>
                    </div>
                    <p class="text-xs text-[var(--text3)] mt-0.5">
                        Modular notifications: Configure Discord, Telegram, or Gmail independently.
                    </p>
                </div>
                <button
                    type="button"
                    class="btn-ref primary sm"
                    @click="isAddOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('settings.add_channel') }}</span>
                </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-12">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--green)]" />
            </div>

            <!-- Empty State -->
            <div v-else-if="channels.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-3">
                    <UIcon name="i-heroicons-bell-slash" class="w-6 h-6 text-[var(--text3)]" />
                </div>
                <p class="text-xs text-[var(--text2)]">{{ $t('settings.no_notifs') }}</p>
                <span class="text-[11px] text-[var(--text3)] mt-1">
                    Notifications are optional. TetherDNS operates normally in silent mode if none are configured.
                </span>
            </div>

            <template v-else>
                <!-- Desktop Table (hidden on mobile < 768px) -->
                <div class="overflow-x-auto w-full hidden md:block">
                    <table class="rtable-ref w-full">
                        <thead>
                            <tr>
                                <th class="w-1/3 min-w-[160px]">{{ $t('settings.col_label') }}</th>
                                <th class="w-1/4 min-w-[120px]">{{ $t('settings.col_type') }}</th>
                                <th class="w-1/4 min-w-[120px]">{{ $t('settings.col_status') }}</th>
                                <th class="w-24 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="ch in channels" :key="ch.id">
                                <td>
                                    <div class="font-bold text-[var(--text)] text-xs">{{ ch.label }}</div>
                                    <span v-if="ch.lastUsedAt" class="text-[10px] text-[var(--text3)] font-mono">
                                        Last active: {{ new Date(ch.lastUsedAt).toLocaleDateString() }}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        class="badge"
                                        :class="{
                                            't-CNAME': ch.type === 'discord',
                                            't-AAAA': ch.type === 'telegram',
                                            't-TXT': ch.type === 'email',
                                            't-A': ch.type === 'line'
                                        }"
                                    >
                                        {{ ch.type.toUpperCase() }}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        class="badge cursor-pointer transition-colors"
                                        :class="ch.enabled ? 'badge-ok hover:opacity-80' : 'badge-crit hover:opacity-80'"
                                        :title="ch.enabled ? 'Click to disable' : 'Click to enable'"
                                        @click="emit('toggle', ch)"
                                    >
                                        {{ ch.enabled ? $t('common.active') : $t('common.disabled') }}
                                    </button>
                                </td>
                                <td class="text-right">
                                    <div class="inline-flex items-center gap-1 justify-end">
                                        <button
                                            type="button"
                                            class="icon-btn sm text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]"
                                            :title="$t('common.test')"
                                            @click="emit('test', ch)"
                                        >
                                            <UIcon name="i-heroicons-paper-airplane" class="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            class="icon-btn sm text-[var(--danger)] hover:bg-[rgba(251,94,122,0.15)]"
                                            :title="$t('common.delete')"
                                            @click="emit('delete', ch.id)"
                                        >
                                            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Channel Cards List (shown only on mobile < 768px) -->
                <div class="notif-mobile-list block md:hidden divide-y divide-[var(--border)]">
                    <div
                        v-for="ch in channels"
                        :key="'mob-ch-' + ch.id"
                        class="p-4 space-y-2.5 hover:bg-[var(--surface2)]/40 transition-colors"
                    >
                        <div class="flex items-center justify-between gap-2">
                            <div class="min-w-0">
                                <div class="font-bold text-sm text-[var(--text)] truncate">{{ ch.label }}</div>
                                <span v-if="ch.lastUsedAt" class="text-[10.5px] text-[var(--text3)] font-mono">
                                    Last: {{ new Date(ch.lastUsedAt).toLocaleDateString() }}
                                </span>
                            </div>
                            <span
                                class="badge shrink-0"
                                :class="{
                                    't-CNAME': ch.type === 'discord',
                                    't-AAAA': ch.type === 'telegram',
                                    't-TXT': ch.type === 'email',
                                    't-A': ch.type === 'line'
                                }"
                            >
                                {{ ch.type.toUpperCase() }}
                            </span>
                        </div>

                        <div class="flex items-center justify-between pt-1">
                            <button
                                type="button"
                                class="badge cursor-pointer transition-colors"
                                :class="ch.enabled ? 'badge-ok hover:opacity-80' : 'badge-crit hover:opacity-80'"
                                @click="emit('toggle', ch)"
                            >
                                {{ ch.enabled ? $t('common.active') : $t('common.disabled') }}
                            </button>

                            <div class="inline-flex items-center gap-1.5">
                                <button
                                    type="button"
                                    class="btn-ref ghost sm flex items-center gap-1"
                                    :title="$t('common.test')"
                                    @click="emit('test', ch)"
                                >
                                    <UIcon name="i-heroicons-paper-airplane" class="w-3.5 h-3.5" />
                                    <span>Test</span>
                                </button>
                                <button
                                    type="button"
                                    class="icon-btn sm text-[var(--danger)] hover:bg-[rgba(251,94,122,0.15)]"
                                    :title="$t('common.delete')"
                                    @click="emit('delete', ch.id)"
                                >
                                    <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Add Channel Modal -->
        <UModal v-model:open="isAddOpen" :ui="{ content: 'sm:max-w-lg' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--text)] flex items-center gap-2">
                            <UIcon name="i-heroicons-bell" class="w-5 h-5 text-[var(--green)]" />
                            <span>{{ $t('settings.add_notif_modal') }}</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isAddOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <form @submit.prevent="add" class="space-y-4">
                        <!-- Provider Tabs -->
                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider mb-2">
                                Notification Provider
                            </label>
                            <div class="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    class="p-3 rounded-xl border text-left transition-all flex flex-col items-center gap-1.5"
                                    :class="type === 'discord' ? 'border-[var(--green)] bg-[rgba(18,224,138,0.1)] text-[var(--green)] font-bold' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]'"
                                    @click="type = 'discord'"
                                >
                                    <UIcon name="i-simple-icons-discord" class="w-5 h-5" />
                                    <span class="text-xs">Discord</span>
                                </button>
                                <button
                                    type="button"
                                    class="p-3 rounded-xl border text-left transition-all flex flex-col items-center gap-1.5"
                                    :class="type === 'telegram' ? 'border-[var(--cyan)] bg-[rgba(45,212,238,0.1)] text-[var(--cyan)] font-bold' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]'"
                                    @click="type = 'telegram'"
                                >
                                    <UIcon name="i-simple-icons-telegram" class="w-5 h-5" />
                                    <span class="text-xs">Telegram</span>
                                </button>
                                <button
                                    type="button"
                                    class="p-3 rounded-xl border text-left transition-all flex flex-col items-center gap-1.5"
                                    :class="type === 'email' ? 'border-[var(--amber)] bg-[rgba(251,191,36,0.1)] text-[var(--amber)] font-bold' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]'"
                                    @click="type = 'email'"
                                >
                                    <UIcon name="i-simple-icons-gmail" class="w-5 h-5" />
                                    <span class="text-xs">Email / Gmail</span>
                                </button>
                            </div>
                        </div>

                        <!-- Channel Label -->
                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.label') }}
                            </label>
                            <input
                                v-model="label"
                                type="text"
                                :placeholder="`e.g. My ${type.toUpperCase()} Alerts`"
                                required
                                class="input w-full"
                            />
                        </div>

                        <!-- Discord Specific Fields -->
                        <div v-if="type === 'discord'" class="space-y-3 p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                            <div>
                                <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                    {{ $t('settings.webhook_url') }} *
                                </label>
                                <input
                                    v-model="webhookUrl"
                                    type="url"
                                    placeholder="https://discord.com/api/webhooks/..."
                                    required
                                    class="input mono w-full"
                                />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">Custom Bot Name</label>
                                    <input v-model="botName" type="text" placeholder="TetherDNS Guardian" class="input sm w-full" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">Role Mention ID (Optional)</label>
                                    <input v-model="mentionRole" type="text" placeholder="e.g. 1122334455 or here" class="input sm w-full" />
                                </div>
                            </div>
                        </div>

                        <!-- Telegram Specific Fields -->
                        <div v-if="type === 'telegram'" class="space-y-3 p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                            <div>
                                <label class="block text-xs font-bold text-[var(--text2)] mb-1">Telegram Bot Token *</label>
                                <input v-model="botToken" type="password" placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" required class="input mono w-full" />
                                <p class="text-[10.5px] text-[var(--text3)] mt-1">Obtain from @BotFather on Telegram.</p>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">Chat ID *</label>
                                    <input v-model="chatId" type="text" placeholder="e.g. 12345678 or -100..." required class="input mono sm w-full" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">Topic ID (Optional)</label>
                                    <input v-model="topicId" type="text" placeholder="For Supergroups" class="input mono sm w-full" />
                                </div>
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer pt-1">
                                <input v-model="telegramSilent" type="checkbox" class="rounded text-[var(--cyan)]" />
                                <span class="text-xs text-[var(--text2)]">Silent Mode (Deliver without alert sound)</span>
                            </label>
                        </div>

                        <!-- Email Specific Fields (Gmail & SMTP) -->
                        <div v-if="type === 'email'" class="space-y-3 p-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                            <div class="flex items-center gap-4 border-b border-[var(--border)] pb-2.5">
                                <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                                    <input v-model="emailProvider" type="radio" value="gmail" />
                                    <span>Gmail 1-Click Preset</span>
                                </label>
                                <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[var(--text3)]">
                                    <input v-model="emailProvider" type="radio" value="custom" />
                                    <span>Custom SMTP</span>
                                </label>
                            </div>

                            <div v-if="emailProvider === 'gmail'" class="text-[11px] text-[var(--text3)] leading-relaxed">
                                Uses Google SMTP (<code>smtp.gmail.com:465 SSL</code>). Use your Gmail address and a 16-digit <b>Google App Password</b>.
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">Gmail / Sender Address *</label>
                                    <input v-model="emailUser" type="email" placeholder="user@gmail.com" required class="input sm w-full" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">App Password (16 chars) *</label>
                                    <input v-model="emailPass" type="password" placeholder="xxxx xxxx xxxx xxxx" required class="input mono sm w-full" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">Deliver To (Recipient Email) *</label>
                                <input v-model="emailTo" type="email" placeholder="admin@example.com (defaults to sender)" class="input sm w-full" />
                            </div>

                            <!-- Custom SMTP extras -->
                            <div v-if="emailProvider === 'custom'" class="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">SMTP Host</label>
                                    <input v-model="emailHost" type="text" placeholder="smtp.example.com" class="input sm w-full" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-[var(--text3)] mb-1">SMTP Port</label>
                                    <input v-model.number="emailPort" type="number" placeholder="465 or 587" class="input sm w-full" />
                                </div>
                            </div>
                        </div>

                        <!-- Granular Event Filter Checkboxes -->
                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider mb-2">
                                Subscribe to Event Types
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <button
                                    v-for="evt in eventOptions"
                                    :key="evt.key"
                                    type="button"
                                    class="p-2.5 rounded-lg border text-left transition-all flex items-center gap-2"
                                    :class="selectedEvents.includes(evt.key) ? 'border-[var(--green)] bg-[rgba(18,224,138,0.06)] text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text3)]'"
                                    @click="toggleEvent(evt.key)"
                                >
                                    <UIcon :name="evt.icon" class="w-4 h-4 flex-none" :class="selectedEvents.includes(evt.key) ? 'text-[var(--green)]' : 'text-[var(--text3)]'" />
                                    <span class="text-xs font-medium">{{ evt.label }}</span>
                                </button>
                            </div>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                            <button type="button" class="btn-ref ghost" @click="isAddOpen = false">
                                {{ $t('common.cancel') }}
                            </button>
                            <button
                                type="submit"
                                class="btn-ref primary"
                                :disabled="isAdding"
                            >
                                <UIcon v-if="isAdding" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                                <span>{{ $t('settings.add_channel') }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>
