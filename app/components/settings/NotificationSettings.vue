<script setup lang="ts">
import { ref } from 'vue'

const { t } = useI18n()

defineProps<{
    channels: any[]
    loading: boolean
}>()

const emit = defineEmits(['add', 'delete', 'test'])

const isAddOpen = ref(false)
const type = ref('discord')
const label = ref('')
const webhookUrl = ref('')
const lineToken = ref('')
const isAdding = ref(false)

const add = async () => {
    isAdding.value = true
    try {
        await emit('add', {
            type: type.value,
            label: label.value,
            webhookUrl: webhookUrl.value,
            lineToken: lineToken.value
        })
        isAddOpen.value = false
        label.value = ''
        webhookUrl.value = ''
        lineToken.value = ''
    } finally {
        isAdding.value = false
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="card set-card overflow-hidden">
            <div class="card-head flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div class="card-title">
                    <UIcon name="i-heroicons-bell" class="w-4 h-4 text-[var(--cyan)]" />
                    <span>{{ $t('settings.notif_title') }}</span>
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

            <!-- Table -->
            <div class="overflow-x-auto -mx-6 -mb-6">
                <table v-if="!loading && channels.length > 0" class="rtable-ref">
                    <thead>
                        <tr>
                            <th>{{ $t('settings.col_label') }}</th>
                            <th>{{ $t('settings.col_type') }}</th>
                            <th>{{ $t('settings.col_status') }}</th>
                            <th style="text-align: right;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ch in channels" :key="ch.id">
                            <td>
                                <span class="font-bold text-[var(--text)]">{{ ch.label }}</span>
                            </td>
                            <td>
                                <span class="badge" :class="ch.type === 'discord' ? 't-CNAME' : 't-A'">
                                    {{ ch.type === 'discord' ? 'Discord' : 'LINE' }}
                                </span>
                            </td>
                            <td>
                                <span class="badge" :class="ch.enabled ? 'badge-ok' : 'badge-crit'">
                                    {{ ch.enabled ? $t('common.active') : $t('common.disabled') }}
                                </span>
                            </td>
                            <td style="text-align: right;">
                                <div class="inline-flex items-center gap-1">
                                    <button
                                        type="button"
                                        class="icon-btn sm text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]"
                                        :title="$t('common.test')"
                                        @click="emit('test', ch)"
                                    >
                                        <UIcon name="i-heroicons-bell-alert" class="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        class="icon-btn sm text-[var(--danger)] hover:bg-[rgba(251,94,122,0.15)]"
                                        @click="emit('delete', ch.id)"
                                    >
                                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="!loading && channels.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-3">
                        <UIcon name="i-heroicons-bell-slash" class="w-6 h-6 text-[var(--text3)]" />
                    </div>
                    <p class="text-xs text-[var(--text2)]">{{ $t('settings.no_notifs') }}</p>
                </div>

                <div v-if="loading" class="flex items-center justify-center py-12">
                    <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--green)]" />
                </div>
            </div>
        </div>

        <!-- Add Channel Modal -->
        <UModal v-model:open="isAddOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
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
                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.type') }}
                            </label>
                            <select
                                v-model="type"
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            >
                                <option value="discord">{{ $t('settings.discord_webhook') }}</option>
                                <option value="line">{{ $t('settings.line_notify') }}</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.label') }}
                            </label>
                            <input
                                v-model="label"
                                type="text"
                                placeholder="e.g. My Server Alerts"
                                required
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
                        </div>

                        <div v-if="type === 'discord'">
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.webhook_url') }}
                            </label>
                            <input
                                v-model="webhookUrl"
                                type="url"
                                placeholder="https://discord.com/api/webhooks/..."
                                required
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
                        </div>

                        <div v-if="type === 'line'">
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.line_token') }}
                            </label>
                            <input
                                v-model="lineToken"
                                type="password"
                                placeholder="Your LINE Notify token"
                                required
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
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
