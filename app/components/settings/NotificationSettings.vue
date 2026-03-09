<script setup lang="ts">
import { ref, computed } from 'vue'

const { t } = useI18n()

const props = defineProps<{
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

const columns = computed(() => [
    { accessorKey: 'label', header: t('settings.col_label') },
    { id: 'type', header: t('settings.col_type') },
    { id: 'enabled', header: t('settings.col_status') },
    { id: 'actions', header: '' },
])

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
    <UCard
        class="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xl rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800/50">
        <template #header>
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-bell" class="w-5 h-5 text-primary-500" />
                    <div>
                        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">{{
                            $t('settings.notif_title') }}</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400 font-sans">{{ $t('settings.notif_subtitle')
                        }}</p>
                    </div>
                </div>
                <UButton icon="i-heroicons-plus" color="primary" class="rounded-xl font-bold font-sans px-4"
                    @click="isAddOpen = true">
                    {{ $t('settings.add_channel') }}
                </UButton>
            </div>
        </template>

        <UTable :data="channels" :columns="columns" :loading="loading" :ui="{
            th: 'bg-transparent text-slate-900 dark:text-slate-100 font-bold font-sans uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-800/50',
            td: 'py-4 font-sans'
        }">
            <template #type-cell="{ row }">
                <UBadge :color="row.original.type === 'discord' ? 'info' : 'success'" variant="soft"
                    class="font-bold rounded-lg px-2.5 py-1">
                    {{ row.original.type === 'discord' ? '🎮 Discord' : '💬 LINE' }}
                </UBadge>
            </template>
            <template #enabled-cell="{ row }">
                <UBadge :color="row.original.enabled ? 'success' : 'neutral'" variant="soft"
                    class="font-black rounded-lg px-2.5 py-1 uppercase text-[10px] tracking-widest">
                    {{ row.original.enabled ? 'Active' : 'Disabled' }}
                </UBadge>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end gap-1">
                    <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-bell-alert"
                        class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                        @click="emit('test', row.original)">{{ $t('common.test') }}</UButton>
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        class="rounded-lg hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                        @click="emit('delete', row.original.id)" />
                </div>
            </template>
        </UTable>

        <UModal v-model:open="isAddOpen" :title="$t('settings.add_notif_modal')"
            :description="$t('settings.add_notif_overlay')" :ui="{
                content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
                header: 'font-black tracking-tight text-xl font-sans'
            }">
            <template #body>
                <form @submit.prevent="add" class="space-y-6">
                    <UFormField :label="$t('settings.type')" name="type">
                        <USelect v-model="type"
                            :items="[{ label: '🎮 Discord Webhook', value: 'discord' }, { label: '💬 LINE Notify', value: 'line' }]"
                            value-key="value" class="w-full" :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>

                    <UFormField :label="$t('settings.label')" name="label">
                        <UInput v-model="label" placeholder="e.g. My Discord Server" class="w-full"
                            :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>

                    <UFormField v-if="type === 'discord'" :label="$t('settings.webhook_url')" name="webhookUrl">
                        <UInput v-model="webhookUrl" placeholder="https://discord.com/api/webhooks/..." class="w-full"
                            :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>

                    <UFormField v-if="type === 'line'" :label="$t('settings.line_token')" name="lineToken">
                        <UInput v-model="lineToken" type="password" placeholder="Your LINE Notify token" class="w-full"
                            :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                            @click="isAddOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isAdding" class="rounded-xl font-bold px-8">{{
                            $t('settings.add_channel') }}
                        </UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
