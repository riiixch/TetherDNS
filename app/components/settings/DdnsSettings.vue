<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    ddnsInterval: string
    loading: boolean
}>()

const emit = defineEmits(['save'])

const localInterval = ref(props.ddnsInterval)

watch(() => props.ddnsInterval, (val) => {
    localInterval.value = val
})

const save = () => {
    emit('save', localInterval.value)
}
</script>

<template>
    <UCard>
        <template #header>
            <h2 class="text-lg font-semibold">{{ $t('settings.ddns_title') }}</h2>
        </template>
        <form @submit.prevent="save" class="space-y-4">
            <UFormField :label="$t('settings.ddns_interval')" name="interval">
                <USelect v-model="localInterval"
                    :items="[{ label: '1 minute', value: '1' }, { label: '5 minutes', value: '5' }, { label: '10 minutes', value: '10' }, { label: '15 minutes', value: '15' }, { label: '30 minutes', value: '30' }, { label: '60 minutes', value: '60' }]"
                    value-key="value" class="w-48" />
                <p class="text-xs text-gray-400 mt-1">{{ $t('settings.ddns_interval_hint') }}</p>
            </UFormField>
            <UButton type="submit" color="primary" :loading="loading">{{ $t('settings.save_settings') }}</UButton>
        </form>
    </UCard>
</template>
