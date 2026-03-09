<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    accounts: any[]
}>()
const emit = defineEmits(['close', 'refresh'])

const { addZone } = useZones()
const toast = useToast()
const { t } = useI18n()

const isOpen = ref(true)
const domainName = ref('')
const selectedAccountId = ref<number | null>(props.accounts.length > 0 ? props.accounts[0].id : null)
const isLoading = ref(false)

const accountOptions = computed(() =>
    props.accounts.map((a: any) => ({ label: `${a.label} (${a.email})`, value: a.id }))
)

const handleAdd = async () => {
    if (!domainName.value) {
        toast.add({ title: t('common.failed'), description: t('zones.err_domain'), color: 'error' })
        return
    }
    if (!selectedAccountId.value) {
        toast.add({ title: t('common.failed'), description: t('zones.err_account'), color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await addZone(domainName.value, selectedAccountId.value)
        toast.add({ title: t('common.success'), description: t('zones.add_success', { name: domainName.value }), color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('zones.add_failed'),
            description: e.data?.statusMessage || e.message || 'An error occurred',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

watch(isOpen, (val) => {
    if (!val) emit('close')
})
</script>

<template>
    <UModal v-model:open="isOpen" :title="$t('zones.add_modal_title')" :description="$t('zones.add_modal_desc')">
        <template #body>
            <form @submit.prevent="handleAdd" class="space-y-4">
                <UFormField :label="$t('zones.account_field')" name="account">
                    <USelect v-model="selectedAccountId" :items="accountOptions" value-key="value"
                        :placeholder="$t('zones.account_placeholder')" class="w-full" />
                    <p class="text-xs text-gray-400 mt-1">{{ $t('zones.account_hint') }}</p>
                </UFormField>

                <UFormField :label="$t('zones.domain_field')" name="domain">
                    <UInput v-model="domainName" :placeholder="$t('zones.domain_placeholder')" class="w-full" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('zones.domain_hint') }}</p>
                </UFormField>

                <div class="flex justify-end gap-3 pt-2">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">{{ $t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading">{{ $t('zones.add_zone') }}</UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
