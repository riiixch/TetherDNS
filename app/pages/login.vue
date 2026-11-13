<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const toast = useToast()
const { t } = useI18n()

const username = ref('')
const password = ref('')
const totpCode = ref('')
const isLoading = ref(false)
const show2FA = ref(false)

const handleLogin = async () => {
    if (!show2FA.value && (!username.value || !password.value)) {
        toast.add({ title: t('auth.login_failed'), description: t('auth.err_required'), color: 'error' })
        return
    }

    if (show2FA.value && !totpCode.value) {
        toast.add({ title: t('auth.login_failed'), description: t('auth.err_2fa_required'), color: 'error' })
        return
    }

    isLoading.value = true
    try {
        const res = await login(username.value, password.value, show2FA.value ? totpCode.value : undefined)

        if (res.requires2FA) {
            show2FA.value = true
            return
        }

        navigateTo('/')
    } catch (e: any) {
        toast.add({
            title: t('auth.login_failed'),
            description: e.data?.statusMessage || e.message || t('auth.err_invalid'),
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
            <h2 class="text-xl font-bold font-['Space_Grotesk'] tracking-tight text-[var(--text)]">
                {{ show2FA ? $t('auth.2fa_notice') : $t('auth.login_title') }}
            </h2>
            <p class="text-xs text-[var(--text3)] mt-1.5 font-medium">
                {{ show2FA ? $t('auth.code_placeholder') : $t('auth.login_subtitle') }}
            </p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
            <template v-if="!show2FA">
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                        {{ $t('auth.username_field') }}
                    </label>
                    <input
                        v-model="username"
                        type="text"
                        :placeholder="$t('auth.username_placeholder')"
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
            </template>

            <template v-else>
                <div class="space-y-2">
                    <input
                        v-model="totpCode"
                        type="text"
                        placeholder="000000"
                        autofocus
                        maxlength="6"
                        class="input mono w-full text-center tracking-[0.4em] text-2xl font-bold py-3"
                    />
                </div>
            </template>

            <div class="pt-3 space-y-3">
                <button
                    type="submit"
                    :disabled="isLoading"
                    class="btn-ref primary w-full py-2.5 font-bold text-sm flex items-center justify-center gap-2"
                >
                    <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                    <span>{{ show2FA ? $t('auth.verify_code') : $t('auth.login_button') }}</span>
                </button>

                <button
                    v-if="show2FA"
                    type="button"
                    class="btn-ref ghost w-full py-2 text-xs font-semibold"
                    @click="show2FA = false"
                >
                    {{ $t('auth.back_to_login') }}
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
