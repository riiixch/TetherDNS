<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ cfZoneId: string }>()
const emit = defineEmits(['close', 'refresh'])
const { addRecord } = useRecords()
const toast = useToast()
const { t } = useI18n()

const isOpen = ref(true)
const recordType = ref('A')
const recordName = ref('')
const recordContent = ref('')
const proxied = ref(false)
const ttl = ref(1)
const priority = ref(10)
const isLoading = ref(false)

const typeOptions = [
    { label: 'A', value: 'A' },
    { label: 'AAAA', value: 'AAAA' },
    { label: 'CNAME', value: 'CNAME' },
    { label: 'MX', value: 'MX' },
    { label: 'TXT', value: 'TXT' },
    { label: 'SRV', value: 'SRV' },
    { label: 'NS', value: 'NS' },
    { label: 'CAA', value: 'CAA' },
]

const contentPlaceholder = computed(() => {
    switch (recordType.value) {
        case 'A': return '192.168.1.1'
        case 'AAAA': return '2001:db8::1'
        case 'CNAME': return 'target.example.com'
        case 'MX': return 'mail.example.com'
        case 'TXT': return 'v=spf1 include:_spf.google.com ~all'
        case 'NS': return 'ns1.example.com'
        case 'CAA': return '0 issue "letsencrypt.org"'
        case 'SRV': return '0 5 5060 sipserver.example.com'
        default: return ''
    }
})

const showPriority = computed(() => ['MX', 'SRV'].includes(recordType.value))
const showProxied = computed(() => ['A', 'AAAA', 'CNAME'].includes(recordType.value))

const handleAdd = async () => {
    if (!recordName.value || !recordContent.value) {
        toast.add({ title: t('common.failed'), description: t('records.err_required'), color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await addRecord(props.cfZoneId, recordType.value, recordName.value, recordContent.value, showProxied.value ? proxied.value : false, ttl.value)
        toast.add({ title: t('common.success'), description: t('records.add_success', { name: recordName.value }), color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('records.add_failed'),
            description: e.data?.statusMessage || e.message || t('common.err_occurred'),
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

watch(isOpen, (val) => { if (!val) emit('close') })
</script>

<template>
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-lg' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('records.add_modal_title') }}</h3>
                            <p class="text-xs text-slate-500 mt-0.5">{{ $t('records.add_modal_desc') }}</p>
                        </div>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                            @click="isOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleAdd" class="space-y-5 py-2">
                    <UFormField :label="$t('records.type_field')" name="type">
                        <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full"
                            :ui="{ base: 'rounded-xl h-10 font-bold' }" />
                    </UFormField>

                    <UFormField :label="$t('records.name_field')" name="name">
                        <UInput v-model="recordName" :placeholder="$t('records.name_placeholder')" class="w-full"
                            :ui="{ base: 'rounded-xl h-10 tracking-wide' }" />
                        <template #help>
                            <p class="text-[11px] text-slate-500 mt-1">{{ $t('records.name_hint') }}</p>
                        </template>
                    </UFormField>

                    <UFormField :label="$t('records.content_field')" name="content">
                        <UInput v-model="recordContent" :placeholder="contentPlaceholder"
                            class="w-full font-mono text-sm" :ui="{ base: 'rounded-xl h-10' }" />
                    </UFormField>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField v-if="showPriority" :label="$t('records.priority_field')" name="priority">
                            <UInput v-model.number="priority" type="number" class="w-full"
                                :ui="{ base: 'rounded-xl h-10' }" />
                        </UFormField>

                        <UFormField :label="$t('records.ttl_field')" name="ttl"
                            :class="!showPriority ? 'col-span-1' : ''">
                            <USelect v-model="ttl"
                                :items="[{ label: 'Auto', value: 1 }, { label: '1 min', value: 60 }, { label: '5 min', value: 300 }, { label: '1 hour', value: 3600 }]"
                                value-key="value" class="w-full" :ui="{ base: 'rounded-xl h-10' }" />
                        </UFormField>
                    </div>

                    <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied" class="pt-2">
                        <USwitch v-model="proxied" color="warning" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold" @click="isOpen = false">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isLoading"
                            class="rounded-xl font-bold px-6 shadow-sm">
                            {{ $t('records.add_record') }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>