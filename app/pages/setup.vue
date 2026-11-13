<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ layout: 'auth' })

const { setup } = useAuth()
const toast = useToast()
const { t } = useI18n()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const handleSetup = async () => {
    if (!username.value || !password.value) {
        toast.add({ title: t('setup.failed'), description: t('setup.err_fields'), color: 'error' })
        return
    }

    if (password.value !== confirmPassword.value) {
        toast.add({ title: t('setup.failed'), description: t('setup.err_match'), color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await setup(username.value, password.value)
        toast.add({ title: t('setup.success'), description: t('setup.created'), color: 'success' })
        navigateTo('/')
    } catch (e: any) {
        toast.add({
            title: t('setup.failed'),
            description: e.data?.statusMessage || e.message || t('setup.err_occurred'),
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="card card-ref p-6 sm:p-8 relative shadow-2xl">
        <div class="mb-6 text-center">
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(18,224,138,0.1)] text-[var(--green)] mb-3">
                <UIcon name="i-heroicons-sparkles" class="w-5 h-5" />
            </div>
            <h2 class="text-xl font-bold font-['Space_Grotesk'] tracking-tight text-[var(--text)]">
                {{ $t('setup.title') }}
            </h2>
            <p class="text-xs text-[var(--text3)] mt-1.5 font-medium">
                {{ $t('setup.subtitle') }}
            </p>
        </div>

        <form @submit.prevent="handleSetup" class="space-y-4">
            <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                    {{ $t('auth.username_field') }}
                </label>
                <input
                    v-model="username"
                    type="text"
                    placeholder="admin"
                    autofocus
                    class="input w-full"
                />
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                    {{ $t('auth.password_field') }}
                </label>
                <input
                    v-model="password"
                    type="password"
                    placeholder="••••••••"
                    class="input w-full tracking-wider"
                />
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                    {{ $t('setup.confirm_password') }}
                </label>
                <input
                    v-model="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    class="input w-full tracking-wider"
                />
            </div>

            <div class="pt-3">
                <button
                    type="submit"
                    :disabled="isLoading"
                    class="btn-ref primary w-full py-2.5 font-bold text-sm flex items-center justify-center gap-2"
                >
                    <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                    <span>{{ $t('setup.save_continue') }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
                </button>
            </div>

            <div class="mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2">
                <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text3)]">
                    Design by <span class="text-[var(--green)]">RIIXCH</span>
                </p>
            </div>
        </form>
    </div>
</template>
