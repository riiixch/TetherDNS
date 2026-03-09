<script setup lang="ts">
import { ref } from 'vue'

const { t } = useI18n()
const emit = defineEmits(['close', 'refresh'])
const { addAccount } = useAccounts()
const toast = useToast()

const isOpen = ref(true)
const label = ref('')
const email = ref('')
const apiToken = ref('')
const isLoading = ref(false)

const handleAdd = async () => {
    if (!label.value || !email.value || !apiToken.value) {
        toast.add({ title: t('common.failed'), description: t('accounts.err_all_fields'), color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await addAccount(label.value, email.value, apiToken.value)
        toast.add({ title: t('common.success'), description: t('accounts.add_success', { label: label.value }), color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('accounts.add_failed'),
            description: e.data?.statusMessage || e.message || t('accounts.err_occurred'),
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
    <UModal v-model:open="isOpen" :title="$t('accounts.add_modal_title')" :description="$t('accounts.add_modal_desc')"
        :ui="{
            content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
            header: 'font-black tracking-tight text-xl font-sans'
        }">
        <template #body>
            <form @submit.prevent="handleAdd" class="space-y-6">
                <UFormField :label="$t('accounts.label_field')" name="label">
                    <UInput v-model="label" :placeholder="$t('accounts.label_placeholder')" class="w-full"
                        :ui="{ base: 'rounded-xl h-12 font-sans' }" autofocus />
                    <template #help>
                        <p class="text-xs text-slate-500 font-sans mt-1">{{ $t('accounts.label_hint') }}</p>
                    </template>
                </UFormField>

                <UFormField :label="$t('accounts.email_field')" name="email">
                    <UInput v-model="email" type="email" :placeholder="$t('accounts.email_placeholder')" class="w-full"
                        :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                </UFormField>

                <UFormField :label="$t('accounts.token_field')" name="apiToken">
                    <UInput v-model="apiToken" type="password" :placeholder="$t('accounts.token_placeholder')"
                        class="w-full" :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    <template #help>
                        <p class="text-xs text-slate-500 font-sans mt-1">{{ $t('accounts.token_hint') }}</p>
                    </template>
                </UFormField>

                <div class="flex justify-end gap-3 pt-2">
                    <UButton color="neutral" variant="ghost" class="rounded-xl font-bold font-sans"
                        @click="isOpen = false">{{
                            $t('common.cancel') }}</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading"
                        class="rounded-xl font-bold font-sans px-8">{{
                            $t('accounts.add_account') }}
                    </UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
