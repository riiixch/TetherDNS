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
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold">{{ $t('security.title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('security.subtitle') }}</p>
                </div>
            </div>
        </template>

        <div class="flex items-center justify-between py-2">
            <div>
                <h3 class="font-medium">{{ $t('security.totp_title') }}</h3>
                <p class="text-sm text-gray-400 mt-1">{{ $t('security.totp_desc') }}</p>
            </div>

            <UButton v-if="!is2FAEnabled" :loading="loading" color="primary" @click="startSetup">
                {{ $t('security.enable_2fa') }}
            </UButton>
            <UButton v-else :loading="loading" color="error" variant="soft" @click="isDisableOpen = true">
                {{ $t('security.disable_2fa') }}
            </UButton>
        </div>

        <!-- Setup Modal -->
        <UModal v-model:open="isSetupOpen" :title="$t('security.setup_title')">
            <template #body>
                <div v-if="setupLoading && !qrCodeUrl" class="flex justify-center py-8">
                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
                </div>
                <form v-else @submit.prevent="verifySetup" class="space-y-6">
                    <div class="flex flex-col items-center gap-4 bg-white p-4 rounded-lg w-fit mx-auto">
                        <img :src="qrCodeUrl" alt="2FA QR Code" class="w-48 h-48" />
                    </div>

                    <div class="text-center text-sm text-gray-400">
                        {{ $t('security.setup_desc') }} <br />
                        <code
                            class="text-primary-400 select-all font-mono mt-2 inline-block bg-gray-900 px-2 py-1 rounded">{{ setupSecret }}</code>
                    </div>

                    <UFormField :label="$t('security.auth_code')" name="token">
                        <UInput v-model="setupToken" :placeholder="$t('security.code_placeholder')" autofocus
                            class="w-full text-center tracking-widest text-lg" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isSetupOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="setupLoading"
                            :disabled="setupToken.length < 6">{{ $t('security.verify_enable') }}</UButton>
                    </div>
                </form>
            </template>
        </UModal>

        <!-- Disable Modal -->
        <UModal v-model:open="isDisableOpen" :title="$t('security.disable_title')">
            <template #body>
                <form @submit.prevent="disable2FA" class="space-y-4">
                    <p class="text-sm text-gray-400">{{ $t('security.disable_desc') }}</p>

                    <UFormField :label="$t('security.auth_code')" name="token">
                        <UInput v-model="disableToken" :placeholder="$t('security.code_placeholder')" autofocus
                            class="w-full text-center tracking-widest text-lg" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isDisableOpen = false">{{ $t('common.cancel')
                            }}</UButton>
                        <UButton type="submit" color="error" :loading="disableLoading"
                            :disabled="disableToken.length < 6">{{ $t('security.disable_2fa') }}</UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
