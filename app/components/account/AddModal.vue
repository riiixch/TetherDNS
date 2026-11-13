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
            <div class="card card-ref p-6 space-y-4">
                <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div>
                        <h3 class="text-base font-bold text-[var(--text)]">{{ $t('accounts.add_modal_title') }}</h3>
                        <p class="text-xs text-[var(--text3)] mt-0.5">{{ $t('accounts.add_modal_desc') }}</p>
                    </div>
                    <button type="button" class="icon-btn sm" @click="isOpen = false">
                        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                    </button>
                </div>

                <form @submit.prevent="handleAdd" class="space-y-4">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            {{ $t('accounts.label_field') }}
                        </label>
                        <input
                            v-model="label"
                            type="text"
                            :placeholder="$t('accounts.label_placeholder')"
                            class="input w-full"
                            autofocus
                        />
                        <p class="text-[11px] text-[var(--text3)]">{{ $t('accounts.label_hint') }}</p>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            {{ $t('accounts.email_field') }}
                        </label>
                        <input
                            v-model="email"
                            type="email"
                            :placeholder="$t('accounts.email_placeholder')"
                            class="input w-full"
                        />
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            {{ $t('accounts.token_field') }}
                        </label>
                        <input
                            v-model="apiToken"
                            type="password"
                            :placeholder="$t('accounts.token_placeholder')"
                            class="input mono w-full"
                        />
                        <p class="text-[11px] text-[var(--text3)]">{{ $t('accounts.token_hint') }}</p>
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                        <button type="button" class="btn-ref ghost" @click="isOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button type="submit" class="btn-ref primary" :disabled="isLoading">
                            <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                            <span>{{ $t('accounts.add_account') }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </UModal>
</template>
