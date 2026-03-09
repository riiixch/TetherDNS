<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const { t } = useI18n()
const props = defineProps<{ record: any }>()
const emit = defineEmits(['close', 'refresh'])
const { updateRecord } = useRecords()
const toast = useToast()

const isOpen = ref(true)
const recordType = ref(props.record.type)
const recordName = ref(props.record.name)
const recordContent = ref(props.record.content)
const proxied = ref(props.record.proxied)
const updateToken = ref(props.record.updateToken)
const isLoading = ref(false)
const isTokenLoading = ref(false)
const isConfirmRevokeOpen = ref(false)

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

const showProxied = computed(() => ['A', 'AAAA', 'CNAME'].includes(recordType.value))

const handleSave = async () => {
    if (!recordName.value || !recordContent.value) {
        toast.add({ title: 'Error', description: 'Name and Content are required', color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await updateRecord(props.record.id, {
            type: recordType.value,
            name: recordName.value,
            content: recordContent.value,
            proxied: showProxied.value ? proxied.value : false,
        })
        toast.add({ title: 'Success', description: `Record ${recordName.value} updated successfully.`, color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: 'Failed to update record',
            description: e.data?.statusMessage || e.message || 'An error occurred',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

const generateToken = async () => {
    isTokenLoading.value = true
    try {
        const res = await $fetch<{ token: string }>(`/api/records/${props.record.id}/token`, { method: 'POST' })
        updateToken.value = res.token
        toast.add({ title: 'Token Generated', description: 'DDNS update URL is now available.', color: 'success' })
        emit('refresh') // So the parent updates its local state too
    } catch (e: any) {
        toast.add({ title: 'Error', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        isTokenLoading.value = false
    }
}

const revokeToken = async () => {
    isTokenLoading.value = true
    try {
        await $fetch<any>(`/api/records/${props.record.id}/token`, { method: 'DELETE' as const })
        updateToken.value = null
        toast.add({ title: t('common.success'), color: 'success' })
        emit('refresh')
        isConfirmRevokeOpen.value = false
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        isTokenLoading.value = false
    }
}


const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.add({ title: t('common.success'), color: 'success' })
}

const ddnsUrl = computed(() => {
    if (!updateToken.value) return ''
    const base = window.location.origin
    return `${base}/api/ddns/update?token=${updateToken.value}&ip=<YOUR_IP>`
})

watch(isOpen, (val) => { if (!val) emit('close') })
</script>

<template>
    <UModal v-model:open="isOpen" :title="$t('records.edit_modal_title')" :description="$t('records.edit_modal_desc')">
        <template #body>
            <form @submit.prevent="handleSave" class="space-y-4">
                <UFormField :label="$t('records.type_field')" name="type">
                    <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full" />
                </UFormField>

                <UFormField :label="$t('records.name_field')" name="name">
                    <UInput v-model="recordName" class="w-full" />
                </UFormField>

                <UFormField :label="$t('records.content_field')" name="content">
                    <UInput v-model="recordContent" class="w-full" />
                </UFormField>

                <UFormField v-if="showProxied" label="Proxied" name="proxied">
                    <USwitch v-model="proxied" color="warning" />
                </UFormField>

                <div v-if="recordType === 'A' || recordType === 'AAAA'" class="mt-6 pt-4 border-t border-gray-800">
                    <h3 class="text-sm font-semibold mb-2">{{ $t('records.api_url') }}</h3>
                    <p class="text-xs text-gray-400 mb-3">{{ $t('records.api_desc') }}</p>

                    <div v-if="updateToken" class="space-y-3">
                        <div class="flex gap-2 items-center">
                            <UInput :model-value="ddnsUrl" readonly class="flex-1 font-mono text-xs" />
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-clipboard-document"
                                @click="copyToClipboard(ddnsUrl)" />
                        </div>
                        <UButton color="error" variant="soft" size="xs" icon="i-heroicons-trash"
                            :loading="isTokenLoading" @click="isConfirmRevokeOpen = true">
                            {{ $t('records.revoke_token') }}
                        </UButton>
                    </div>
                    <UButton v-else color="neutral" variant="soft" icon="i-heroicons-key" :loading="isTokenLoading"
                        @click="generateToken">
                        {{ $t('records.generate_url') }}
                    </UButton>
                </div>

                <div class="flex justify-end gap-3 pt-4 lg:pt-2">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">{{ $t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading">{{ $t('common.save') }}</UButton>
                </div>
            </form>
        </template>
    </UModal>

    <!-- Revoke Confirmation Modal -->
    <UModal v-model:open="isConfirmRevokeOpen" :title="$t('records.revoke_token')">
        <template #body>
            <div class="space-y-4">
                <p class="text-gray-300">
                    {{ $t('records.revoke_warning') }}
                </p>
                <div class="flex justify-end gap-3 pt-2">
                    <UButton color="neutral" variant="ghost" @click="isConfirmRevokeOpen = false">{{ $t('common.cancel')
                        }}
                    </UButton>
                    <UButton color="error" :loading="isTokenLoading" @click="revokeToken">{{ $t('records.revoke_token')
                        }}
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>
