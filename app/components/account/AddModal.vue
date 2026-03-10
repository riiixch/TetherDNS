<script setup lang="ts">
import { ref, watch } from 'vue'

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
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-md' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">

                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('accounts.add_modal_title') }}</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{
                                $t('accounts.add_modal_desc') }}</p>
                        </div>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                            @click="isOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleAdd" class="space-y-5 py-2">
                    <UFormField :label="$t('accounts.label_field')" name="label">
                        <UInput v-model="label" :placeholder="$t('accounts.label_placeholder')" class="w-full"
                            :ui="{ root: 'rounded-xl h-10' }" autofocus />
                        <template #help>
                            <p class="text-[11px] text-slate-500 mt-1">{{ $t('accounts.label_hint') }}</p>
                        </template>
                    </UFormField>

                    <UFormField :label="$t('accounts.email_field')" name="email">
                        <UInput v-model="email" type="email" :placeholder="$t('accounts.email_placeholder')"
                            class="w-full" :ui="{ root: 'rounded-xl h-10' }" />
                    </UFormField>

                    <UFormField :label="$t('accounts.token_field')" name="apiToken">
                        <UInput v-model="apiToken" type="password" :placeholder="$t('accounts.token_placeholder')"
                            class="w-full" :ui="{ root: 'rounded-xl h-10' }" />
                        <template #help>
                            <p class="text-[11px] text-slate-500 mt-1">{{ $t('accounts.token_hint') }}</p>
                        </template>
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold" @click="isOpen = false">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isLoading"
                            class="rounded-xl font-bold px-6 shadow-sm">
                            {{ $t('accounts.add_account') }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>