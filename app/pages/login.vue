<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
    layout: 'auth',
})

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
        toast.add({
            title: t('auth.login_failed'),
            description: t('auth.err_required'),
            color: 'error'
        })
        return
    }

    if (show2FA.value && !totpCode.value) {
        toast.add({
            title: t('auth.login_failed'),
            description: t('auth.err_2fa_required'),
            color: 'error'
        })
        return
    }

    isLoading.value = true
    try {
        const res = await login(username.value, password.value, show2FA.value ? totpCode.value : undefined)

        if (res.requires2FA) {
            show2FA.value = true
            return
        }

        // After successful login, redirect to dashboard
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
    <UCard class="w-full">
        <template #header>
            <h2 class="text-xl font-semibold text-center mt-2">{{ $t('auth.login_title') }}</h2>
            <p class="text-sm text-gray-400 text-center mt-1">{{ $t('auth.login_subtitle') }}</p>
        </template>

        <form @submit.prevent="handleLogin" class="space-y-4">
            <template v-if="!show2FA">
                <UFormField :label="$t('auth.username_field')" name="username">
                    <UInput v-model="username" :placeholder="$t('auth.username_placeholder')" autofocus
                        class="w-full" />
                </UFormField>

                <UFormField :label="$t('auth.password_field')" name="password">
                    <UInput v-model="password" type="password" placeholder="••••••••" class="w-full" />
                </UFormField>
            </template>

            <template v-else>
                <div class="text-sm font-medium text-gray-400 text-center mb-4">
                    {{ $t('auth.2fa_notice') }}
                </div>
                <UFormField :label="$t('auth.auth_code')" name="totpCode">
                    <UInput v-model="totpCode" :placeholder="$t('auth.code_placeholder')" autofocus
                        class="w-full text-center tracking-widest text-lg" />
                </UFormField>
            </template>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-4">
                {{ show2FA ? $t('auth.verify_code') : $t('auth.login_button') }}
            </UButton>

            <UButton v-if="show2FA" type="button" variant="ghost" color="neutral" block @click="show2FA = false"
                class="mt-2 text-gray-400">
                {{ $t('auth.back_to_login') }}
            </UButton>
        </form>
    </UCard>
</template>
