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
        toast.add({ title: t('common.failed'), description: t('records.err_required'), color: 'error' })
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
        toast.add({ title: t('common.success'), description: t('records.add_success', { name: recordName.value }), color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('common.failed'),
            description: e.data?.statusMessage || e.message || t('common.err_occurred'),
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
        toast.add({ title: t('common.success'), description: t('records.api_desc'), color: 'success' })
        emit('refresh') // So the parent updates its local state too
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
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
    <UModal v-model:open="isOpen" :title="$t('records.edit_modal_title')" :description="$t('records.edit_modal_desc')"
        :ui="{
            content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
            header: 'font-black tracking-tight text-xl font-sans'
        }">
        <template #body>
            <form @submit.prevent="handleSave" class="space-y-6">
                <UFormField :label="$t('records.type_field')" name="type">
                    <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full"
                        :ui="{ base: 'rounded-xl h-12 font-sans font-bold' }" />
                </UFormField>

                <UFormField :label="$t('records.name_field')" name="name">
                    <UInput v-model="recordName" class="w-full"
                        :ui="{ base: 'rounded-xl h-12 font-sans tracking-wide' }" />
                </UFormField>

                <UFormField :label="$t('records.content_field')" name="content">
                    <UInput v-model="recordContent" class="w-full font-mono" :ui="{ base: 'rounded-xl h-12' }" />
                </UFormField>

                <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied">
                    <USwitch v-model="proxied" color="warning" />
                </UFormField>

                <div v-if="recordType === 'A' || recordType === 'AAAA'"
                    class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans mb-1">{{
                        $t('records.api_url') }}</h3>
                    <p class="text-xs text-slate-500 font-sans mb-4">{{ $t('records.api_desc') }}</p>

                    <div v-if="updateToken" class="space-y-3">
                        <div class="flex gap-2 items-center">
                            <UInput :model-value="ddnsUrl" readonly class="flex-1 font-mono text-xs"
                                :ui="{ base: 'rounded-xl' }" />
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-clipboard-document"
                                class="rounded-xl" @click="copyToClipboard(ddnsUrl)" />
                        </div>
                        <UButton color="error" variant="soft" size="xs" icon="i-heroicons-trash"
                            class="rounded-lg font-bold" :loading="isTokenLoading" @click="isConfirmRevokeOpen = true">
                            {{ $t('records.revoke_token') }}
                        </UButton>
                    </div>
                    <UButton v-else color="neutral" variant="soft" icon="i-heroicons-key" :loading="isTokenLoading"
                        class="rounded-xl font-bold font-sans w-full justify-center h-10" @click="generateToken">
                        {{ $t('records.generate_url') }}
                    </UButton>
                </div>

                <div class="flex justify-end gap-3 pt-4 mt-2 lg:pt-4 border-t border-slate-200 dark:border-slate-800">
                    <UButton color="neutral" variant="ghost" class="rounded-xl font-bold font-sans"
                        @click="isOpen = false">{{ $t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading"
                        class="rounded-xl font-bold font-sans px-8">{{ $t('common.save') }}</UButton>
                </div>
            </form>
        </template>
    </UModal>

    <!-- Revoke Confirmation Modal -->
    <UModal v-model:open="isConfirmRevokeOpen" :title="$t('records.revoke_token')" :ui="{
        content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
        header: 'font-black tracking-tight text-xl font-sans text-error-500'
    }">
        <template #body>
            <div class="space-y-6">
                <p class="text-slate-600 dark:text-slate-300 font-sans">
                    {{ $t('records.revoke_warning') }}
                </p>
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <UButton color="neutral" variant="ghost" class="rounded-xl font-bold font-sans"
                        @click="isConfirmRevokeOpen = false">{{ $t('common.cancel') }}
                    </UButton>
                    <UButton color="error" :loading="isTokenLoading" class="rounded-xl font-bold font-sans px-8"
                        @click="revokeToken">{{ $t('records.revoke_token') }}
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>
