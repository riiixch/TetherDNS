<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    ddnsInterval: string
    loading: boolean
}>()

const emit = defineEmits(['save'])

const { locale, setLocale } = useI18n()
const colorMode = useColorMode()
const toast = useToast()

const localInterval = ref(Number(props.ddnsInterval) || 5)
const autoUpdate = ref(true)
const notify = ref(true)
const isResetModalOpen = ref(false)

watch(() => props.ddnsInterval, (val) => {
    localInterval.value = Number(val) || 5
})

const save = () => {
    emit('save', String(localInterval.value))
}

const handleReset = () => {
    isResetModalOpen.value = false
    toast.add({ title: 'Cache Flushed', description: 'System temporary cache has been purged.', color: 'success' })
}
</script>

<template>
    <div class="settings-grid">
        <!-- 1. General Preferences Card -->
        <div class="card set-card">
            <div class="card-head" style="padding-bottom: 8px;">
                <div class="card-title">
                    <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-[var(--cyan)]" />
                    <span>General Preferences</span>
                </div>
            </div>

            <!-- Language Row -->
            <div class="set-row">
                <div class="set-label">System Language / ภาษา</div>
                <div class="seg">
                    <button
                        type="button"
                        :class="{ on: locale === 'th' }"
                        @click="setLocale('th')"
                    >
                        ไทย
                    </button>
                    <button
                        type="button"
                        :class="{ on: locale === 'en' }"
                        @click="setLocale('en')"
                    >
                        English
                    </button>
                </div>
            </div>

            <!-- Theme Row -->
            <div class="set-row">
                <div class="set-label">Visual Theme / ธีมหน้าต่าง</div>
                <ClientOnly>
                    <div class="seg">
                        <button
                            type="button"
                            :class="{ on: colorMode.value === 'dark' }"
                            @click="colorMode.preference = 'dark'"
                        >
                            <UIcon name="i-heroicons-moon" class="w-3.5 h-3.5 mr-1" />
                            Dark
                        </button>
                        <button
                            type="button"
                            :class="{ on: colorMode.value === 'light' }"
                            @click="colorMode.preference = 'light'"
                        >
                            <UIcon name="i-heroicons-sun" class="w-3.5 h-3.5 mr-1" />
                            Light
                        </button>
                    </div>
                </ClientOnly>
            </div>
        </div>

        <!-- 2. Engine & Automation Card -->
        <div class="card set-card">
            <div class="card-head" style="padding-bottom: 8px;">
                <div class="card-title">
                    <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-[var(--green)]" />
                    <span>Engine & Automation</span>
                </div>
            </div>

            <!-- Interval Slider Row -->
            <div class="range-row">
                <div class="range-top">
                    <div>
                        <div class="set-label">DDNS Check Interval</div>
                        <div class="set-hint">Frequency to probe external IP changes and trigger edge sync</div>
                    </div>
                    <output class="range-val">{{ localInterval }} min</output>
                </div>
                <input
                    v-model.number="localInterval"
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    class="w-full accent-[var(--green)] cursor-pointer"
                />
            </div>

            <!-- Switches -->
            <div class="set-row">
                <div>
                    <div class="set-label">Automated Mutation</div>
                    <div class="set-hint">Automatically patch Cloudflare DNS A/AAAA records when IP changes</div>
                </div>
                <label class="switch-ref">
                    <input v-model="autoUpdate" type="checkbox" />
                    <span></span>
                </label>
            </div>

            <div class="set-row">
                <div>
                    <div class="set-label">Push Notifications</div>
                    <div class="set-hint">Send Discord / LINE / Webhook alerts on IP mutation events</div>
                </div>
                <label class="switch-ref">
                    <input v-model="notify" type="checkbox" />
                    <span></span>
                </label>
            </div>

            <div class="pt-4 border-t border-[var(--border)] flex justify-end">
                <button
                    type="button"
                    class="btn-ref primary"
                    :disabled="loading"
                    @click="save"
                >
                    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                    <span>{{ $t('settings.save_settings') }}</span>
                </button>
            </div>
        </div>

        <!-- 3. System Architecture Card -->
        <div class="card set-card">
            <div class="card-head" style="padding-bottom: 8px;">
                <div class="card-title">
                    <UIcon name="i-heroicons-server" class="w-4 h-4 text-[var(--violet)]" />
                    <span>System Architecture</span>
                </div>
            </div>
            <div class="about-row">
                <span>Version</span>
                <b>TetherDNS v4.3.1</b>
            </div>
            <div class="about-row">
                <span>API Protocol</span>
                <b>Cloudflare API v4</b>
            </div>
            <div class="about-row">
                <span>Region</span>
                <b>APAC (SIN)</b>
            </div>
            <div class="about-row">
                <span>Build Engine</span>
                <b>Nuxt 4.6 + Prisma 7.10</b>
            </div>
        </div>

        <!-- 4. Danger Zone Card -->
        <div class="card set-card danger-card">
            <div class="card-head" style="padding-bottom: 8px;">
                <div class="card-title" style="color: var(--danger)">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
                    <span>Danger Zone</span>
                </div>
            </div>
            <div class="set-row">
                <div>
                    <div class="set-label">Flush System Cache</div>
                    <div class="set-hint">Purge local IP state cache and force edge re-synchronization</div>
                </div>
                <button
                    type="button"
                    class="btn-ref danger-ghost"
                    @click="isResetModalOpen = true"
                >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                    <span>Flush Cache</span>
                </button>
            </div>
        </div>

        <!-- Reset Confirm Modal -->
        <UModal v-model:open="isResetModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--danger)] flex items-center gap-2">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                            <span>Flush Cache</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isResetModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        Are you sure you want to flush temporary cache? This will cause the scheduler to re-probe IP addresses on the next cycle.
                    </p>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="isResetModalOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button type="button" class="btn-ref danger" @click="handleReset">
                            Confirm Flush
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
