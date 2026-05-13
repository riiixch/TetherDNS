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
    <UCard :ui="{ header: 'px-6 py-6 border-none', body: 'px-6 pb-8 pt-0' }"
        class="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
        <template #header>
            <h2 class="text-xl font-bold text-center text-slate-900 dark:text-white tracking-tight">
                {{ show2FA ? $t('auth.2fa_notice') : $t('auth.login_title') }}
            </h2>
            <p class="text-xs text-slate-500 text-center mt-1.5 font-medium">
                {{ show2FA ? $t('auth.code_placeholder') : $t('auth.login_subtitle') }}
            </p>
        </template>

        <form @submit.prevent="handleLogin" class="space-y-5">
            <template v-if="!show2FA">
                <UFormField :label="$t('auth.username_field')" name="username">
                    <UInput v-model="username" :placeholder="$t('auth.username_placeholder')" autofocus class="w-full"
                        :ui="{ root: 'rounded-xl h-11' }" />
                </UFormField>

                <UFormField :label="$t('auth.password_field')" name="password">
                    <UInput v-model="password" type="password" placeholder="••••••••" class="w-full tracking-wider"
                        :ui="{ root: 'rounded-xl h-11' }" />
                </UFormField>
            </template>

            <template v-else>
                <UFormField name="totpCode">
                    <UInput v-model="totpCode" placeholder="000000" autofocus
                        class="w-full text-center tracking-[0.4em] text-2xl font-bold font-mono"
                        :ui="{ root: 'rounded-2xl h-14' }" />
                </UFormField>
            </template>

            <div class="pt-2">
                <UButton type="submit" color="primary" block :loading="isLoading"
                    class="h-11 rounded-xl font-bold shadow-md shadow-primary-500/20">
                    {{ show2FA ? $t('auth.verify_code') : $t('auth.login_button') }}
                </UButton>

                <UButton v-if="show2FA" type="button" variant="ghost" color="neutral" block @click="show2FA = false"
                    class="mt-3 rounded-xl font-medium">
                    {{ $t('auth.back_to_login') }}
                </UButton>

                <div class="mt-6 flex items-center justify-center gap-2">
                    <div class="h-px w-4 bg-slate-200 dark:bg-slate-800"></div>
                    <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500">
                        Design by <span class="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-default transition-colors">RIIIXCH</span>
                    </p>
                    <div class="h-px w-4 bg-slate-200 dark:bg-slate-800"></div>
                </div>
            </div>
        </form>
    </UCard>
</template>