<script setup lang="ts">
const props = defineProps<{
    open: boolean
}>()

const emit = defineEmits(['update:open', 'success'])

const { t } = useI18n()
const toast = useToast()

const state = reactive({
    name: '',
    type: 'HTTP',
    target: '',
    interval: 5
})

const options = [
    { label: 'HTTP', value: 'HTTP' },
    { label: 'HTTPS', value: 'HTTPS' },
    { label: 'PING', value: 'PING' }
]

const loading = ref(false)

const submit = async () => {
    loading.value = true
    try {
        await $fetch('/api/monitoring', {
            method: 'POST',
            body: state
        })
        toast.add({ title: t('common.success'), color: 'success' })
        emit('success')
        emit('update:open', false)
        // Reset state
        state.name = ''
        state.target = ''
    } catch (e: any) {
        toast.add({ title: t('common.error'), description: e.message, color: 'error' })
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <UModal :open="open" @update:open="$emit('update:open', $event)" :title="$t('monitoring.modal_title')">
        <template #body>
            <form class="space-y-4" @submit.prevent="submit">
                <UFormField :label="$t('monitoring.label_name')" name="name">
                    <UInput v-model="state.name" placeholder="My Website" class="w-full" />
                </UFormField>

                <UFormField :label="$t('monitoring.label_type')" name="type">
                    <USelect v-model="state.type" :items="options" class="w-full" />
                </UFormField>

                <UFormField :label="$t('monitoring.label_target')" name="target" :help="$t('monitoring.help_target')">
                    <UInput v-model="state.target" placeholder="https://example.com" class="w-full" />
                </UFormField>

                <UFormField :label="$t('monitoring.label_interval')" name="interval">
                    <UInput v-model="state.interval" type="number" trailing-icon="i-heroicons-clock" class="w-full" />
                </UFormField>

                <div class="flex justify-end gap-x-3 pt-4">
                    <UButton color="neutral" variant="ghost" @click="$emit('update:open', false)">
                        {{ $t('common.cancel') }}
                    </UButton>
                    <UButton type="submit" :loading="loading" color="primary">
                        {{ $t('common.save') }}
                    </UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
