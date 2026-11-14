<script setup lang="ts">
import { computed } from 'vue'
import type { ZoneAnalyticsThreatDetails } from '~~/types/analytics'

const props = defineProps<{
    threatDetails?: ZoneAnalyticsThreatDetails
    totalThreats?: number
    threatRatio?: number
    zoneId?: string | number
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'open-security'): void
}>()

const details = computed(() => props.threatDetails || {
    wafMitigated: 0,
    botMitigated: 0,
    rateLimited: 0
})

const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0'
    return new Intl.NumberFormat().format(num)
}
</script>

<template>
    <div class="card flex flex-col h-full">
        <div class="card-head">
            <div class="card-title">
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-[var(--danger)]" />
                <span>{{ $t('analytics.threat_mitigation_breakdown') }}</span>
            </div>
            <span class="chip rose">SECURITY</span>
        </div>

        <div class="card-body flex-1 flex flex-col justify-between gap-4">
            <div v-if="loading" class="flex items-center justify-center py-10">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
            </div>

            <div v-else class="space-y-3.5">
                <!-- Big Threat Total Banner -->
                <div class="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-[var(--text3)] uppercase font-semibold tracking-wider">
                            {{ $t('analytics.mitigated_threats') }}
                        </div>
                        <div class="text-2xl font-bold mono text-[var(--danger)] mt-0.5">
                            {{ formatNumber(totalThreats) }}
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold mono"
                            :class="(totalThreats ?? 0) > 0 ? 'bg-red-500/10 text-[var(--danger)] border border-red-500/30' : 'bg-emerald-500/10 text-[var(--green)] border border-emerald-500/30'"
                        >
                            <UIcon :name="(totalThreats ?? 0) > 0 ? 'i-heroicons-shield-exclamation' : 'i-heroicons-check-badge'" class="w-3.5 h-3.5" />
                            {{ (totalThreats ?? 0) > 0 ? `${threatRatio}% BLOCKED` : 'ZERO THREATS' }}
                        </span>
                    </div>
                </div>

                <!-- Three Mitigation Categories -->
                <div class="grid grid-cols-3 gap-2">
                    <!-- WAF Rules -->
                    <div class="p-2.5 rounded border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
                        <div class="flex items-center gap-1 text-[11px] text-[var(--text2)]">
                            <UIcon name="i-heroicons-shield-check" class="w-3.5 h-3.5 text-[var(--danger)] shrink-0" />
                            <span class="truncate">{{ $t('analytics.waf_rules') }}</span>
                        </div>
                        <div class="text-lg font-bold mono text-[var(--text1)] mt-1">
                            {{ formatNumber(details.wafMitigated) }}
                        </div>
                    </div>

                    <!-- Bot Mitigation -->
                    <div class="p-2.5 rounded border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
                        <div class="flex items-center gap-1 text-[11px] text-[var(--text2)]">
                            <UIcon name="i-heroicons-cpu-chip" class="w-3.5 h-3.5 text-[var(--amber)] shrink-0" />
                            <span class="truncate">{{ $t('analytics.bot_mitigation') }}</span>
                        </div>
                        <div class="text-lg font-bold mono text-[var(--text1)] mt-1">
                            {{ formatNumber(details.botMitigated) }}
                        </div>
                    </div>

                    <!-- Rate Limiting -->
                    <div class="p-2.5 rounded border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
                        <div class="flex items-center gap-1 text-[11px] text-[var(--text2)]">
                            <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-[var(--cyan)] shrink-0" />
                            <span class="truncate">{{ $t('analytics.rate_limiting') }}</span>
                        </div>
                        <div class="text-lg font-bold mono text-[var(--text1)] mt-1">
                            {{ formatNumber(details.rateLimited) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Quick Link to Security Quick-Switch -->
            <div class="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span class="text-[var(--text3)] flex items-center gap-1 text-[11px] truncate">
                    <UIcon name="i-heroicons-lock-closed" class="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                    <span class="truncate">{{ $t('analytics.security_controls_hint') }}</span>
                </span>
                <button
                    type="button"
                    class="btn-ref ghost text-xs py-1 px-2.5 inline-flex items-center gap-1 text-[var(--cyan)] shrink-0 ml-2"
                    @click="emit('open-security')"
                >
                    <span>{{ $t('analytics.open_security_controls') }}</span>
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
                </button>
            </div>
        </div>
    </div>
</template>
