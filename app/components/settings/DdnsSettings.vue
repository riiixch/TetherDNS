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
    <UCard :ui="{ header: 'px-5 sm:px-6 py-5', body: 'p-5 sm:p-6' }"
        class="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                    <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-primary-500" />
                </div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{ $t('settings.ddns_title')
                    }}</h2>
            </div>
        </template>

        <form @submit.prevent="save" class="space-y-6">
            <UFormField :label="$t('settings.ddns_interval')" name="interval"
                help-class="text-slate-500 dark:text-slate-400 mt-2">
                <USelect v-model="localInterval" :items="[
                    { label: $t('times.minutes', { n: 1 }), value: '1' },
                    { label: $t('times.minutes', { n: 5 }), value: '5' },
                    { label: $t('times.minutes', { n: 10 }), value: '10' },
                    { label: $t('times.minutes', { n: 15 }), value: '15' },
                    { label: $t('times.minutes', { n: 30 }), value: '30' },
                    { label: $t('times.minutes', { n: 60 }), value: '60' }
                ]" value-key="value" class="w-full max-w-xs" :ui="{ base: 'rounded-xl' }" />
                <template #help>
                    <p class="text-xs">{{ $t('settings.ddns_interval_hint') }}</p>
                </template>
            </UFormField>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
                <UButton type="submit" color="primary" :loading="loading" class="rounded-xl font-bold px-6 shadow-sm">
                    {{ $t('settings.save_settings') }}
                </UButton>
            </div>
        </form>
    </UCard>
</template>