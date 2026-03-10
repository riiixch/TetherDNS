<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { t } = useI18n()
const toast = useToast()

const is2FAEnabled = ref(false)
const loading = ref(true)

const isSetupOpen = ref(false)
const setupLoading = ref(false)
const qrCodeUrl = ref('')
const setupSecret = ref('')
const setupToken = ref('')

const isDisableOpen = ref(false)
const disableToken = ref('')
const disableLoading = ref(false)

const loadStatus = async () => {
    try {
        const res = await $fetch<{ enabled: boolean }>('/api/auth/2fa/status')
        is2FAEnabled.value = res.enabled
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    } finally {
        loading.value = false
    }
}

const startSetup = async () => {
    isSetupOpen.value = true
    setupLoading.value = true
    try {
        const res = await $fetch<{ qrCodeUrl: string, secret: string }>('/api/auth/2fa/generate', { method: 'POST' })
        qrCodeUrl.value = res.qrCodeUrl
        setupSecret.value = res.secret
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
        isSetupOpen.value = false
    } finally {
        setupLoading.value = false
    }
}

const verifySetup = async () => {
    setupLoading.value = true
    try {
        await $fetch('/api/auth/2fa/verify', { method: 'POST', body: { token: setupToken.value } })
        toast.add({ title: t('common.success'), description: t('security.enabled_success'), color: 'success' })
        is2FAEnabled.value = true
        isSetupOpen.value = false
        setupToken.value = ''
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        setupLoading.value = false
    }
}

const disable2FA = async () => {
    disableLoading.value = true
    try {
        await $fetch('/api/auth/2fa/disable', { method: 'POST', body: { token: disableToken.value } })
        toast.add({ title: t('common.success'), description: t('security.disabled_success'), color: 'success' })
        is2FAEnabled.value = false
        isDisableOpen.value = false
        disableToken.value = ''
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        disableLoading.value = false
    }
}

onMounted(() => loadStatus())
</script>

<template>
    <UCard :ui="{ header: 'px-5 sm:px-6 py-5', body: 'p-5 sm:p-6' }"
        class="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                    <UIcon name="i-heroicons-shield-check-solid" class="w-5 h-5 text-primary-500" />
                </div>
                <div>
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{ $t('security.title')
                    }}</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('security.subtitle') }}</p>
                </div>
            </div>
        </template>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
                <h3 class="font-bold text-slate-900 dark:text-slate-100">{{ $t('security.totp_title') }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{{ $t('security.totp_desc') }}</p>
            </div>

            <UButton v-if="!is2FAEnabled" :loading="loading" color="primary"
                class="rounded-xl font-bold px-6 shadow-sm w-full sm:w-auto justify-center" @click="startSetup">
                {{ $t('security.enable_2fa') }}
            </UButton>
            <UButton v-else :loading="loading" color="error" variant="soft"
                class="rounded-xl font-bold px-6 w-full sm:w-auto justify-center" @click="isDisableOpen = true">
                {{ $t('security.disable_2fa') }}
            </UButton>
        </div>

        <UModal v-model:open="isSetupOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard
                    :ui="{ header: 'border-b border-slate-200 dark:border-slate-800', footer: 'border-t border-slate-200 dark:border-slate-800' }"
                    class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('security.setup_title')
                            }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="isSetupOpen = false" />
                        </div>
                    </template>

                    <div v-if="setupLoading && !qrCodeUrl" class="flex justify-center py-10">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
                    </div>

                    <form v-else @submit.prevent="verifySetup" class="space-y-6 py-2">
                        <div
                            class="flex flex-col items-center gap-4 bg-white p-4 rounded-xl w-fit mx-auto ring-1 ring-slate-200 shadow-sm">
                            <img :src="qrCodeUrl" alt="2FA QR Code" class="w-48 h-48 object-contain" />
                        </div>

                        <div class="text-center text-sm text-slate-600 dark:text-slate-400">
                            {{ $t('security.setup_desc') }} <br />
                            <code
                                class="text-primary-600 dark:text-primary-400 select-all font-mono mt-3 inline-block bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                {{ setupSecret }}
            </code>
                        </div>

                        <UFormField :label="$t('security.auth_code')" name="token">
                            <UInput v-model="setupToken" :placeholder="$t('security.code_placeholder')" autofocus
                                class="w-full text-center tracking-[0.3em] text-xl font-bold font-mono"
                                :ui="{ root: 'rounded-xl h-12' }" />
                        </UFormField>

                        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                                @click="isSetupOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton type="submit" color="primary" :loading="setupLoading"
                                class="rounded-xl font-bold px-6 shadow-sm" :disabled="setupToken.length < 6">
                                {{ $t('security.verify_enable') }}
                            </UButton>
                        </div>
                    </form>
                </UCard>
            </template>
        </UModal>

        <UModal v-model:open="isDisableOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard
                    :ui="{ header: 'border-b border-slate-200 dark:border-slate-800', footer: 'border-t border-slate-200 dark:border-slate-800' }"
                    class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-red-600 dark:text-red-400">{{
                                $t('security.disable_title') }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="isDisableOpen = false" />
                        </div>
                    </template>

                    <form @submit.prevent="disable2FA" class="space-y-6 py-2">
                        <p class="text-sm text-slate-600 dark:text-slate-300">
                            {{ $t('security.disable_desc') }}
                        </p>

                        <UFormField :label="$t('security.auth_code')" name="token">
                            <UInput v-model="disableToken" :placeholder="$t('security.code_placeholder')" autofocus
                                class="w-full text-center tracking-[0.3em] text-xl font-bold font-mono"
                                :ui="{ root: 'rounded-xl h-12' }" />
                        </UFormField>

                        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                                @click="isDisableOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton type="submit" color="error" :loading="disableLoading"
                                class="rounded-xl font-bold px-6 shadow-sm" :disabled="disableToken.length < 6">
                                {{ $t('security.disable_2fa') }}
                            </UButton>
                        </div>
                    </form>
                </UCard>
            </template>
        </UModal>
    </UCard>
</template>