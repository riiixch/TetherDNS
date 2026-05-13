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
    <UCard :ui="{ header: 'px-6 py-6 border-none', body: 'px-6 pb-8 pt-0' }"
        class="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
        <template #header>
            <div class="flex items-center justify-center gap-2 mb-2">
                <UIcon name="i-heroicons-sparkles-solid" class="w-5 h-5 text-amber-500" />
                <h2 class="text-xl font-bold text-center text-slate-900 dark:text-white tracking-tight">{{
                    $t('setup.title') }}</h2>
            </div>
            <p class="text-xs text-slate-500 text-center font-medium">{{ $t('setup.subtitle') }}</p>
        </template>

        <form @submit.prevent="handleSetup" class="space-y-5">
            <UFormField :label="$t('auth.username_field')" name="username">
                <UInput v-model="username" placeholder="admin" autofocus class="w-full"
                    :ui="{ root: 'rounded-xl h-11' }" />
            </UFormField>

            <UFormField :label="$t('auth.password_field')" name="password">
                <UInput v-model="password" type="password" placeholder="••••••••" class="w-full tracking-wider"
                    :ui="{ root: 'rounded-xl h-11' }" />
            </UFormField>

            <UFormField :label="$t('setup.confirm_password')" name="confirmPassword">
                <UInput v-model="confirmPassword" type="password" placeholder="••••••••" class="w-full tracking-wider"
                    :ui="{ root: 'rounded-xl h-11' }" />
            </UFormField>

            <div class="pt-2">
                <UButton type="submit" color="primary" block :loading="isLoading"
                    class="h-11 rounded-xl font-bold shadow-md shadow-primary-500/20">
                    {{ $t('setup.save_continue') }}
                    <template #trailing>
                        <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
                    </template>
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