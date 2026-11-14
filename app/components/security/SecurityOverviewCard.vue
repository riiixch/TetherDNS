<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ZoneSecuritySettings, SecurityLevel } from '~~/types/security'

const props = defineProps<{
    settings: ZoneSecuritySettings | null
    loading?: boolean
    updating?: boolean
}>()

const emit = defineEmits<{
    (e: 'update-level', level: SecurityLevel): void
    (e: 'update-general', data: { challengeTtl?: number; browserCheck?: 'on' | 'off' }): void
}>()

const { t } = useI18n()

const securityLevels: Array<{ value: SecurityLevel; label: string; desc: string; color: string }> = [
    { value: 'essentially_off', label: 'waf.level_essentially_off', desc: 'waf.desc_essentially_off', color: 'text-[var(--text3)]' },
    { value: 'low', label: 'waf.level_low', desc: 'waf.desc_low', color: 'text-blue-400' },
    { value: 'medium', label: 'waf.level_medium', desc: 'waf.desc_medium', color: 'text-[var(--green)]' },
    { value: 'high', label: 'waf.level_high', desc: 'waf.desc_high', color: 'text-[var(--amber)]' },
    { value: 'under_attack', label: 'waf.level_under_attack', desc: 'waf.desc_under_attack', color: 'text-[var(--danger)]' },
]

const challengeTtlOptions = [
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes (Default)' },
    { value: 3600, label: '1 hour' },
    { value: 7200, label: '2 hours' },
    { value: 86400, label: '1 day' },
    { value: 604800, label: '1 week' },
    { value: 31536000, label: '1 year' },
]

const computedTtlOptions = computed(() => {
    const list = [...challengeTtlOptions]
    const current = props.settings?.challengeTtl
    if (current !== undefined && current !== null && !list.some(o => o.value === current)) {
        list.push({ value: current, label: `${current} seconds (Custom)` })
        list.sort((a, b) => a.value - b.value)
    }
    return list
})

const selectedLevel = computed(() => props.settings?.securityLevel || 'medium')
const isUnderAttack = computed(() => props.settings?.isUnderAttack || props.settings?.securityLevel === 'under_attack')

const toggleUnderAttack = () => {
    if (isUnderAttack.value) {
        emit('update-level', 'medium')
    } else {
        emit('update-level', 'under_attack')
    }
}

const handleLevelChange = (level: SecurityLevel) => {
    if (level !== selectedLevel.value) {
        emit('update-level', level)
    }
}

const handleTtlChange = (e: Event) => {
    const val = parseInt((e.target as HTMLSelectElement).value, 10)
    emit('update-general', { challengeTtl: val })
}

const toggleBrowserCheck = () => {
    const nextVal = props.settings?.browserCheck === 'on' ? 'off' : 'on'
    emit('update-general', { browserCheck: nextVal })
}
</script>

<template>
    <div class="space-y-4">
        <!-- Emergency Under Attack Banner -->
        <div
            class="p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden"
            :class="isUnderAttack
                ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_30px_rgba(251,94,122,0.25)]'
                : 'bg-[var(--surface2)] border-[var(--border)]'"
        >
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-start gap-3.5">
                    <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        :class="isUnderAttack
                            ? 'bg-red-500/20 text-[var(--danger)] border-red-500/40 animate-pulse'
                            : 'bg-emerald-500/10 text-[var(--green)] border-emerald-500/20'"
                    >
                        <UIcon
                            :name="isUnderAttack ? 'i-heroicons-shield-exclamation' : 'i-heroicons-shield-check'"
                            class="w-5 h-5"
                        />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-sm sm:text-base text-[var(--text)]">
                                {{ $t('waf.emergency_shield') }}
                            </span>
                            <span
                                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border"
                                :class="isUnderAttack
                                    ? 'bg-red-500/20 text-[var(--danger)] border-red-500/40'
                                    : 'bg-[var(--surface)] text-[var(--text3)] border-[var(--border)]'"
                            >
                                {{ isUnderAttack ? $t('waf.under_attack_active') : $t('waf.under_attack_inactive') }}
                            </span>
                        </div>
                        <p class="text-xs text-[var(--text2)] mt-1 max-w-xl leading-relaxed">
                            {{ $t('waf.emergency_shield_desc') }}
                        </p>
                    </div>
                </div>

                <div class="shrink-0 w-full sm:w-auto">
                    <button
                        type="button"
                        class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border"
                        :class="isUnderAttack
                            ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface2)]'
                            : 'bg-red-600 hover:bg-red-500 text-white border-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]'"
                        :disabled="loading || updating"
                        @click="toggleUnderAttack"
                    >
                        <UIcon v-if="updating" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                        <UIcon v-else-if="isUnderAttack" name="i-heroicons-x-mark" class="w-4 h-4" />
                        <UIcon v-else name="i-heroicons-bolt" class="w-4 h-4" />
                        <span>{{ isUnderAttack ? $t('waf.btn_disable_attack') : $t('waf.btn_enable_attack') }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Security Level Controls Card -->
        <div class="card p-4 sm:p-5">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                <div>
                    <h3 class="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                        <UIcon name="i-heroicons-adjustments-horizontal" class="w-4 h-4 text-[var(--cyan)]" />
                        <span>{{ $t('waf.security_level') }}</span>
                    </h3>
                    <p class="text-xs text-[var(--text3)] mt-0.5">
                        {{ $t('waf.security_level_desc') }}
                    </p>
                </div>
                <span class="chip cyan uppercase">CLOUDFLARE WAF</span>
            </div>

            <!-- Segmented Level Buttons -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                    v-for="lvl in securityLevels"
                    :key="lvl.value"
                    type="button"
                    class="p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2"
                    :class="selectedLevel === lvl.value
                        ? 'bg-[var(--surface2)] border-[var(--green)] shadow-[0_0_15px_rgba(18,224,138,0.15)] ring-1 ring-[var(--green)]'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border2)] opacity-80 hover:opacity-100'"
                    :disabled="loading || updating"
                    @click="handleLevelChange(lvl.value)"
                >
                    <div class="flex items-center justify-between w-full">
                        <span class="font-bold text-xs" :class="lvl.color">
                            {{ $t(lvl.label) }}
                        </span>
                        <span
                            v-if="selectedLevel === lvl.value"
                            class="w-2 h-2 rounded-full bg-[var(--green)] shadow-[0_0_8px_var(--green)]"
                        ></span>
                    </div>
                    <span class="text-[10px] text-[var(--text3)] leading-tight">
                        {{ $t(lvl.desc) }}
                    </span>
                </button>
            </div>

            <!-- Secondary Settings: Challenge TTL & Browser Integrity Check -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-[var(--border)]">
                <!-- Challenge TTL -->
                <div class="flex flex-col justify-between gap-2">
                    <div>
                        <label class="text-xs font-semibold text-[var(--text)] block">
                            {{ $t('waf.challenge_ttl') }}
                        </label>
                        <span class="text-[11px] text-[var(--text3)] block mt-0.5">
                            {{ $t('waf.challenge_ttl_desc') }}
                        </span>
                    </div>
                    <div>
                        <select
                            class="w-full sm:w-64 px-3 py-1.5 rounded-lg text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                            :value="settings?.challengeTtl ?? 1800"
                            :disabled="loading || updating"
                            @change="handleTtlChange"
                        >
                            <option
                                v-for="opt in computedTtlOptions"
                                :key="opt.value"
                                :value="opt.value"
                            >
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Browser Integrity Check (BIC) -->
                <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <div>
                        <div class="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                            <UIcon name="i-heroicons-finger-print" class="w-4 h-4 text-[var(--cyan)]" />
                            <span>{{ $t('waf.browser_check') }}</span>
                        </div>
                        <span class="text-[11px] text-[var(--text3)] block mt-0.5">
                            {{ $t('waf.browser_check_desc') }}
                        </span>
                    </div>
                    <button
                        type="button"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border shrink-0 flex items-center gap-1.5"
                        :class="settings?.browserCheck === 'on'
                            ? 'bg-emerald-500/10 text-[var(--green)] border-emerald-500/30'
                            : 'bg-[var(--surface2)] text-[var(--text3)] border-[var(--border)]'"
                        :disabled="loading || updating"
                        @click="toggleBrowserCheck"
                    >
                        <UIcon v-if="updating" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
                        <span v-else>{{ settings?.browserCheck === 'on' ? 'ACTIVE' : 'OFF' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
