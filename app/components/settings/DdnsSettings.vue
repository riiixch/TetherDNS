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
    <UCard
        class="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xl rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800/50">
        <template #header>
            <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-primary-500" />
                <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">{{
                    $t('settings.ddns_title') }}</h2>
            </div>
        </template>
        <form @submit.prevent="save" class="space-y-6">
            <UFormField :label="$t('settings.ddns_interval')" name="interval"
                help-class="text-slate-500 dark:text-slate-400">
                <USelect v-model="localInterval"
                    :items="[{ label: '1 minute', value: '1' }, { label: '5 minutes', value: '5' }, { label: '10 minutes', value: '10' }, { label: '15 minutes', value: '15' }, { label: '30 minutes', value: '30' }, { label: '60 minutes', value: '60' }]"
                    value-key="value" class="w-full max-w-xs" :ui="{ base: 'rounded-xl font-sans' }" />
                <template #help>
                    <p class="text-xs mt-1">{{ $t('settings.ddns_interval_hint') }}</p>
                </template>
            </UFormField>

            <div class="flex pt-2">
                <UButton type="submit" color="primary" :loading="loading"
                    class="rounded-xl font-bold font-sans px-6 shadow-lg shadow-primary-500/20">
                    {{ $t('settings.save_settings') }}
                </UButton>
            </div>
        </form>
    </UCard>
</template>
