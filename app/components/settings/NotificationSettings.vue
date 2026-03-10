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
    <UCard :ui="{ header: 'px-5 sm:px-6 py-5', body: 'p-0 sm:p-0' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                        <UIcon name="i-heroicons-bell-solid" class="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{
                            $t('settings.notif_title') }}</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('settings.notif_subtitle') }}
                        </p>
                    </div>
                </div>
                <UButton icon="i-heroicons-plus" color="primary"
                    class="rounded-xl font-bold px-4 shadow-sm w-full md:w-auto justify-center"
                    @click="isAddOpen = true">
                    {{ $t('settings.add_channel') }}
                </UButton>
            </div>
        </template>

        <div class="overflow-x-auto">
            <UTable :data="channels" :columns="columns" :loading="loading" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800',
                td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #label-cell="{ row }">
                    <span class="font-semibold text-slate-900 dark:text-white">{{ row.original.label }}</span>
                </template>
                <template #type-cell="{ row }">
                    <UBadge :color="row.original.type === 'discord' ? 'info' : 'success'" variant="subtle" size="xs"
                        class="font-bold">
                        {{ row.original.type === 'discord' ? 'Discord' : 'LINE' }}
                    </UBadge>
                </template>
                <template #enabled-cell="{ row }">
                    <UBadge :color="row.original.enabled ? 'success' : 'neutral'" variant="soft" size="xs"
                        class="font-bold uppercase tracking-wider">
                        {{ row.original.enabled ? 'Active' : 'Disabled' }}
                    </UBadge>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-1.5">
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-bell-alert"
                            class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            @click="emit('test', row.original)">
                            <span class="sr-only">{{ $t('common.test') }}</span>
                        </UButton>
                        <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            @click="emit('delete', row.original.id)" />
                    </div>
                </template>
            </UTable>

            <div v-if="!loading && channels.length === 0"
                class="flex flex-col items-center justify-center p-10 text-center">
                <div
                    class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <UIcon name="i-heroicons-bell-slash" class="w-6 h-6 text-slate-400" />
                </div>
                <p class="text-sm font-medium text-slate-500">No notification channels added.</p>
            </div>
        </div>

        <UModal v-model:open="isAddOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('settings.add_notif_modal') }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="isAddOpen = false" />
                        </div>
                    </template>

                    <form @submit.prevent="add" class="space-y-5 py-2">
                        <UFormField :label="$t('settings.type')" name="type">
                            <USelect v-model="type" :items="[
                                { label: 'Discord Webhook', value: 'discord' },
                                { label: 'LINE Notify', value: 'line' }
                            ]" value-key="value" class="w-full" :ui="{ base: 'rounded-xl' }" />
                        </UFormField>

                        <UFormField :label="$t('settings.label')" name="label">
                            <UInput v-model="label" placeholder="e.g. My Server Alerts" class="w-full"
                                :ui="{ root: 'rounded-xl' }" />
                        </UFormField>

                        <UFormField v-if="type === 'discord'" :label="$t('settings.webhook_url')" name="webhookUrl">
                            <UInput v-model="webhookUrl" placeholder="https://discord.com/api/webhooks/..."
                                class="w-full" :ui="{ root: 'rounded-xl' }" />
                        </UFormField>

                        <UFormField v-if="type === 'line'" :label="$t('settings.line_token')" name="lineToken">
                            <UInput v-model="lineToken" type="password" placeholder="Your LINE Notify token"
                                class="w-full" :ui="{ root: 'rounded-xl' }" />
                        </UFormField>

                        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                                @click="isAddOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton type="submit" color="primary" :loading="isAdding"
                                class="rounded-xl font-bold px-6 shadow-sm">
                                {{ $t('settings.add_channel') }}
                            </UButton>
                        </div>
                    </form>
                </UCard>
            </template>
        </UModal>
    </UCard>
</template>