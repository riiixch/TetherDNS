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
        emit('refresh')
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
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-lg' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('records.edit_modal_title') }}</h3>
                            <p class="text-xs text-slate-500 mt-0.5">{{ $t('records.edit_modal_desc') }}</p>
                        </div>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                            @click="isOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleSave" class="space-y-5 py-2">
                    <UFormField :label="$t('records.type_field')" name="type">
                        <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full"
                            :ui="{ base: 'rounded-xl h-10 font-bold' }" />
                    </UFormField>

                    <UFormField :label="$t('records.name_field')" name="name">
                        <UInput v-model="recordName" class="w-full" :ui="{ base: 'rounded-xl h-10 tracking-wide' }" />
                    </UFormField>

                    <UFormField :label="$t('records.content_field')" name="content">
                        <UInput v-model="recordContent" class="w-full font-mono text-sm"
                            :ui="{ base: 'rounded-xl h-10' }" />
                    </UFormField>

                    <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied" class="pt-1">
                        <USwitch v-model="proxied" color="warning" />
                    </UFormField>

                    <div v-if="recordType === 'A' || recordType === 'AAAA'"
                        class="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 border-dashed">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ $t('records.api_url') }}
                                </h3>
                                <p class="text-[11px] text-slate-500">{{ $t('records.api_desc') }}</p>
                            </div>
                        </div>

                        <div v-if="updateToken" class="space-y-3">
                            <div class="flex gap-2">
                                <UInput :model-value="ddnsUrl" readonly
                                    class="flex-1 font-mono text-[11px] sm:text-xs text-slate-600 dark:text-slate-300"
                                    :ui="{ base: 'rounded-xl bg-slate-50 dark:bg-slate-900' }" />
                                <UButton color="neutral" variant="soft" icon="i-heroicons-clipboard-document"
                                    class="rounded-xl shadow-sm shrink-0" @click="copyToClipboard(ddnsUrl)" />
                            </div>
                            <div class="flex justify-end">
                                <UButton color="error" variant="ghost" size="xs" icon="i-heroicons-trash"
                                    class="rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-500/10"
                                    :loading="isTokenLoading" @click="isConfirmRevokeOpen = true">
                                    {{ $t('records.revoke_token') }}
                                </UButton>
                            </div>
                        </div>
                        <UButton v-else color="neutral" variant="soft" icon="i-heroicons-key" :loading="isTokenLoading"
                            class="rounded-xl font-bold w-full justify-center h-10 shadow-sm border border-slate-200 dark:border-slate-700"
                            @click="generateToken">
                            {{ $t('records.generate_url') }}
                        </UButton>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold" @click="isOpen = false">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isLoading"
                            class="rounded-xl font-bold px-6 shadow-sm">
                            {{ $t('common.save') }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>

    <UModal v-model:open="isConfirmRevokeOpen" :ui="{ content: 'sm:max-w-sm' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-bold text-red-600 dark:text-red-400">{{ $t('records.revoke_token') }}
                        </h3>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                            @click="isConfirmRevokeOpen = false" />
                    </div>
                </template>
                <div class="py-2">
                    <p class="text-sm text-slate-600 dark:text-slate-300">
                        {{ $t('records.revoke_warning') }}
                    </p>
                    <div class="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                            @click="isConfirmRevokeOpen = false">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton color="error" variant="solid" :loading="isTokenLoading"
                            class="rounded-xl font-bold px-6 shadow-sm" @click="revokeToken">
                            {{ $t('records.revoke_token') }}
                        </UButton>
                    </div>
                </div>
            </UCard>
        </template>
    </UModal>
</template>