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
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold">{{ $t('settings.notif_title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('settings.notif_subtitle') }}</p>
                </div>
                <UButton icon="i-heroicons-plus" color="primary" @click="isAddOpen = true">
                    {{ $t('settings.add_channel') }}
                </UButton>
            </div>
        </template>

        <UTable :data="channels" :columns="columns" :loading="loading">
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
                        @click="emit('test', row.original)">{{ $t('common.test') }}</UButton>
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        @click="emit('delete', row.original.id)" />
                </div>
            </template>
        </UTable>

        <UModal v-model:open="isAddOpen" :title="$t('settings.add_notif_modal')"
            :description="$t('settings.add_notif_overlay')">
            <template #body>
                <form @submit.prevent="add" class="space-y-4">
                    <UFormField :label="$t('settings.type')" name="type">
                        <USelect v-model="type"
                            :items="[{ label: '🎮 Discord Webhook', value: 'discord' }, { label: '💬 LINE Notify', value: 'line' }]"
                            value-key="value" class="w-full" />
                    </UFormField>

                    <UFormField :label="$t('settings.label')" name="label">
                        <UInput v-model="label" placeholder="e.g. My Discord Server" class="w-full" />
                    </UFormField>

                    <UFormField v-if="type === 'discord'" :label="$t('settings.webhook_url')" name="webhookUrl">
                        <UInput v-model="webhookUrl" placeholder="https://discord.com/api/webhooks/..."
                            class="w-full" />
                    </UFormField>

                    <UFormField v-if="type === 'line'" :label="$t('settings.line_token')" name="lineToken">
                        <UInput v-model="lineToken" type="password" placeholder="Your LINE Notify token"
                            class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isAddOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isAdding">{{ $t('settings.add_channel') }}
                        </UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
