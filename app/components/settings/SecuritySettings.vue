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
    <UCard
        class="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xl rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800/50">
        <template #header>
            <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-primary-500" />
                <div>
                    <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">{{
                        $t('security.title') }}</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400 font-sans">{{ $t('security.subtitle') }}</p>
                </div>
            </div>
        </template>

        <div class="flex items-center justify-between py-2">
            <div>
                <h3 class="font-bold text-slate-900 dark:text-slate-100 font-sans">{{ $t('security.totp_title') }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">{{ $t('security.totp_desc') }}</p>
            </div>

            <UButton v-if="!is2FAEnabled" :loading="loading" color="primary" class="rounded-xl font-bold font-sans px-6"
                @click="startSetup">
                {{ $t('security.enable_2fa') }}
            </UButton>
            <UButton v-else :loading="loading" color="error" variant="soft" class="rounded-xl font-bold font-sans px-6"
                @click="isDisableOpen = true">
                {{ $t('security.disable_2fa') }}
            </UButton>
        </div>

        <!-- Setup Modal -->
        <UModal v-model:open="isSetupOpen" :title="$t('security.setup_title')" :ui="{
            content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
            header: 'font-black tracking-tight text-xl font-sans'
        }">
            <template #body>
                <div v-if="setupLoading && !qrCodeUrl" class="flex justify-center py-8">
                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
                </div>
                <form v-else @submit.prevent="verifySetup" class="space-y-6">
                    <div
                        class="flex flex-col items-center gap-4 bg-white p-6 rounded-2xl w-fit mx-auto shadow-inner ring-1 ring-slate-200">
                        <img :src="qrCodeUrl" alt="2FA QR Code" class="w-48 h-48" />
                    </div>

                    <div class="text-center text-sm text-slate-500 dark:text-slate-400 font-sans">
                        {{ $t('security.setup_desc') }} <br />
                        <code
                            class="text-primary-400 select-all font-mono mt-2 inline-block bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm">{{ setupSecret }}</code>
                    </div>

                    <UFormField :label="$t('security.auth_code')" name="token">
                        <UInput v-model="setupToken" :placeholder="$t('security.code_placeholder')" autofocus
                            class="w-full text-center tracking-widest text-xl font-bold"
                            :ui="{ base: 'rounded-xl h-12' }" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                            @click="isSetupOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="setupLoading" class="rounded-xl font-bold px-8"
                            :disabled="setupToken.length < 6">{{ $t('security.verify_enable') }}</UButton>
                    </div>
                </form>
            </template>
        </UModal>

        <!-- Disable Modal -->
        <UModal v-model:open="isDisableOpen" :title="$t('security.disable_title')" :ui="{
            content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
            header: 'font-black tracking-tight text-xl font-sans'
        }">
            <template #body>
                <form @submit.prevent="disable2FA" class="space-y-6">
                    <p class="text-sm text-slate-500 dark:text-slate-400 font-sans">{{ $t('security.disable_desc') }}
                    </p>

                    <UFormField :label="$t('security.auth_code')" name="token">
                        <UInput v-model="disableToken" :placeholder="$t('security.code_placeholder')" autofocus
                            class="w-full text-center tracking-widest text-xl font-bold"
                            :ui="{ base: 'rounded-xl h-12' }" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                            @click="isDisableOpen = false">{{ $t('common.cancel')
                            }}</UButton>
                        <UButton type="submit" color="error" :loading="disableLoading" class="rounded-xl font-bold px-8"
                            :disabled="disableToken.length < 6">{{ $t('security.disable_2fa') }}</UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
