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
            description: e.data?.statusMessage || e.message || 'An error occurred',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

watch(isOpen, (val) => { if (!val) emit('close') })
</script>

<template>
    <UModal v-model:open="isOpen" :title="$t('records.add_modal_title')" :description="$t('records.add_modal_desc')">
        <template #body>
            <form @submit.prevent="handleAdd" class="space-y-4">
                <UFormField :label="$t('records.type_field')" name="type">
                    <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full" />
                </UFormField>

                <UFormField :label="$t('records.name_field')" name="name">
                    <UInput v-model="recordName" :placeholder="$t('records.name_placeholder')" class="w-full" />
                    <p class="text-xs text-gray-400 mt-1">{{ $t('records.name_hint') }}</p>
                </UFormField>

                <UFormField :label="$t('records.content_field')" name="content">
                    <UInput v-model="recordContent" :placeholder="contentPlaceholder" class="w-full" />
                </UFormField>

                <UFormField v-if="showPriority" :label="$t('records.priority_field')" name="priority">
                    <UInput v-model.number="priority" type="number" class="w-32" />
                </UFormField>

                <div class="flex items-center gap-4">
                    <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied">
                        <USwitch v-model="proxied" color="warning" />
                    </UFormField>

                    <UFormField :label="$t('records.ttl_field')" name="ttl">
                        <USelect v-model="ttl"
                            :items="[{ label: 'Auto', value: 1 }, { label: '1 min', value: 60 }, { label: '5 min', value: 300 }, { label: '1 hour', value: 3600 }]"
                            value-key="value" class="w-32" />
                    </UFormField>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">{{ $t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading">{{ $t('records.add_record') }}</UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
