<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ZoneSecuritySettings, SecurityLevel } from '~~/types/security'

const props = defineProps<{
    isOpen: boolean
    zoneId: string | number
    zoneName: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const updating = ref(false)
const settings = ref<ZoneSecuritySettings | null>(null)
const permissionWarning = ref<string | null>(null)

const loadSettings = async () => {
    if (!props.zoneId) return
    loading.value = true
    permissionWarning.value = null
    try {
        const res = await $fetch<any>(`/api/zones/${props.zoneId}/security`)
        if (res.permissionRequired) {
            permissionWarning.value = res.message
        } else if (res.success) {
            settings.value = res.data
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        loading.value = false
    }
}

const updateLevel = async (level: SecurityLevel) => {
    if (!props.zoneId) return
    updating.value = true
    try {
        const res = await $fetch<any>(`/api/zones/${props.zoneId}/security`, {
            method: 'PATCH',
            body: { securityLevel: level }
        })
        if (res.success) {
            settings.value = res.data
            toast.add({
                title: t('common.success'),
                description: t('waf.level_updated_success', { level }),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        updating.value = false
    }
}

const handleGeneralUpdate = async (data: { challengeTtl?: number; browserCheck?: 'on' | 'off' }) => {
    if (!props.zoneId) return
    updating.value = true
    try {
        const res = await $fetch<any>(`/api/zones/${props.zoneId}/security`, {
            method: 'PATCH',
            body: data
        })
        if (res.success) {
            settings.value = res.data
            toast.add({
                title: t('common.success'),
                description: t('waf.settings_updated_success'),
                color: 'success'
            })
        }
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.data?.message || e.message, color: 'error' })
    } finally {
        updating.value = false
    }
}

watch(() => props.isOpen, (open) => {
    if (open) {
        loadSettings()
    }
})

watch(() => props.zoneId, (newZid) => {
    if (props.isOpen && newZid) {
        loadSettings()
    }
})
</script>

<template>
    <UModal :open="isOpen" :ui="{ content: 'sm:max-w-2xl' }" @update:open="(val: boolean) => !val && emit('close')">
        <template #content>
            <div class="card card-ref p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                <div class="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-[var(--danger)]" />
                        <div>
                            <h3 class="font-bold text-base text-[var(--text)]">
                                {{ $t('waf.quick_security_title') }}
                            </h3>
                            <span class="text-xs font-mono text-[var(--cyan)]">
                                {{ zoneName }}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="text-[var(--text3)] hover:text-[var(--text)]"
                        @click="emit('close')"
                    >
                        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                    </button>
                </div>

                <!-- Permission Warning if API Token lacks permissions -->
                <div v-if="permissionWarning" class="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 flex items-start gap-2.5">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <div class="font-bold text-amber-300">{{ $t('waf.missing_permission_title') }}</div>
                        <p class="mt-0.5 text-[11px] leading-relaxed">{{ permissionWarning }}</p>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="flex items-center justify-center py-10">
                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
                </div>

                <!-- Main Security Overview Component -->
                <SecurityOverviewCard
                    v-else
                    :settings="settings"
                    :loading="loading"
                    :updating="updating"
                    @update-level="updateLevel"
                    @update-general="handleGeneralUpdate"
                />

                <!-- Footer Navigation to Full Zone Security Page -->
                <div class="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                    <NuxtLink
                        :to="`/zones/${zoneId}?tab=security`"
                        class="text-[var(--cyan)] hover:underline inline-flex items-center gap-1 font-semibold"
                        @click="emit('close')"
                    >
                        <span>{{ $t('waf.manage_in_zone_page') }}</span>
                        <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
                    </NuxtLink>

                    <button
                        type="button"
                        class="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text2)] hover:bg-[var(--surface2)]"
                        @click="emit('close')"
                    >
                        {{ $t('common.close') }}
                    </button>
                </div>
            </div>
        </template>
    </UModal>
</template>
