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
    <div class="space-y-6">
        <div class="card set-card">
            <div class="card-head" style="padding-bottom: 8px;">
                <div class="card-title">
                    <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-[var(--cyan)]" />
                    <span>{{ $t('security.title') }}</span>
                </div>
            </div>

            <div class="set-row">
                <div>
                    <div class="set-label">{{ $t('security.totp_title') }}</div>
                    <div class="set-hint">{{ $t('security.totp_desc') }}</div>
                </div>

                <div>
                    <button
                        v-if="!is2FAEnabled"
                        type="button"
                        class="btn-ref primary"
                        :disabled="loading"
                        @click="startSetup"
                    >
                        <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                        <span>{{ $t('security.enable_2fa') }}</span>
                    </button>
                    <button
                        v-else
                        type="button"
                        class="btn-ref danger-ghost"
                        :disabled="loading"
                        @click="isDisableOpen = true"
                    >
                        <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                        <span>{{ $t('security.disable_2fa') }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Setup 2FA Modal -->
        <UModal v-model:open="isSetupOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--text)] flex items-center gap-2">
                            <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-[var(--green)]" />
                            <span>{{ $t('security.setup_title') }}</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isSetupOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <div v-if="setupLoading && !qrCodeUrl" class="flex justify-center py-10">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)]" />
                    </div>

                    <form v-else @submit.prevent="verifySetup" class="space-y-4">
                        <div class="flex flex-col items-center gap-3 bg-white p-4 rounded-xl w-fit mx-auto shadow-sm">
                            <img :src="qrCodeUrl" alt="2FA QR Code" class="w-44 h-44 object-contain" />
                        </div>

                        <div class="text-center text-xs text-[var(--text2)]">
                            {{ $t('security.setup_desc') }} <br />
                            <code class="text-[var(--green)] select-all font-mono mt-2 inline-block bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                                {{ setupSecret }}
                            </code>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('security.auth_code') }}
                            </label>
                            <input
                                v-model="setupToken"
                                type="text"
                                :placeholder="$t('security.code_placeholder')"
                                autofocus
                                class="w-full text-center tracking-[0.3em] text-xl font-bold font-mono py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                            <button type="button" class="btn-ref ghost" @click="isSetupOpen = false">
                                {{ $t('common.cancel') }}
                            </button>
                            <button
                                type="submit"
                                class="btn-ref primary"
                                :disabled="setupLoading || setupToken.length < 6"
                            >
                                <UIcon v-if="setupLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                                <span>{{ $t('security.verify_enable') }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>

        <!-- Disable 2FA Modal -->
        <UModal v-model:open="isDisableOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--danger)] flex items-center gap-2">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                            <span>{{ $t('security.disable_title') }}</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isDisableOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <form @submit.prevent="disable2FA" class="space-y-4">
                        <p class="text-xs text-[var(--text2)] leading-relaxed">
                            {{ $t('security.disable_desc') }}
                        </p>

                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('security.auth_code') }}
                            </label>
                            <input
                                v-model="disableToken"
                                type="text"
                                :placeholder="$t('security.code_placeholder')"
                                autofocus
                                class="w-full text-center tracking-[0.3em] text-xl font-bold font-mono py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--danger)]"
                            />
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                            <button type="button" class="btn-ref ghost" @click="isDisableOpen = false">
                                {{ $t('common.cancel') }}
                            </button>
                            <button
                                type="submit"
                                class="btn-ref danger"
                                :disabled="disableLoading || disableToken.length < 6"
                            >
                                <UIcon v-if="disableLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                                <span>{{ $t('security.disable_2fa') }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>
