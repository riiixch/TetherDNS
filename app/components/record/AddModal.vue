<script setup lang="ts">
import { ref } from 'vue'

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
    <UModal v-model:open="isOpen" :title="$t('records.add_modal_title')" :description="$t('records.add_modal_desc')"
        :ui="{
            content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
            header: 'font-black tracking-tight text-xl font-sans'
        }">
        <template #body>
            <form @submit.prevent="handleAdd" class="space-y-6">
                <UFormField :label="$t('records.type_field')" name="type">
                    <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full"
                        :ui="{ base: 'rounded-xl h-12 font-sans font-bold' }" />
                </UFormField>

                <UFormField :label="$t('records.name_field')" name="name">
                    <UInput v-model="recordName" :placeholder="$t('records.name_placeholder')" class="w-full"
                        :ui="{ base: 'rounded-xl h-12 font-sans tracking-wide' }" />
                    <template #help>
                        <p class="text-xs text-slate-500 font-sans mt-1">{{ $t('records.name_hint') }}</p>
                    </template>
                </UFormField>

                <UFormField :label="$t('records.content_field')" name="content">
                    <UInput v-model="recordContent" :placeholder="contentPlaceholder" class="w-full font-mono"
                        :ui="{ base: 'rounded-xl h-12' }" />
                </UFormField>

                <UFormField v-if="showPriority" :label="$t('records.priority_field')" name="priority">
                    <UInput v-model.number="priority" type="number" class="w-32"
                        :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                </UFormField>

                <div class="flex items-center gap-6 pt-2">
                    <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied">
                        <USwitch v-model="proxied" color="warning" />
                    </UFormField>

                    <UFormField :label="$t('records.ttl_field')" name="ttl">
                        <USelect v-model="ttl"
                            :items="[{ label: 'Auto', value: 1 }, { label: '1 min', value: 60 }, { label: '5 min', value: 300 }, { label: '1 hour', value: 3600 }]"
                            value-key="value" class="w-32" :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <UButton color="neutral" variant="ghost" class="rounded-xl font-bold font-sans"
                        @click="isOpen = false">{{
                            $t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading"
                        class="rounded-xl font-bold font-sans px-8">{{
                            $t('records.add_record') }}</UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
