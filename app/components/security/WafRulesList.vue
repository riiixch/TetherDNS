<script setup lang="ts">
import type { WafCustomRule } from '~~/types/security'

const props = defineProps<{
    rules: WafCustomRule[]
    loading?: boolean
    togglingId?: string | null
}>()

const emit = defineEmits<{
    (e: 'toggle-rule', rule: WafCustomRule, nextState: boolean): void
}>()

const getActionBadge = (action: string) => {
    switch (action) {
        case 'block':
            return 'bg-red-500/15 text-[var(--danger)] border-red-500/30'
        case 'challenge':
        case 'managed_challenge':
            return 'bg-amber-500/15 text-[var(--amber)] border-amber-500/30'
        case 'js_challenge':
            return 'bg-cyan-500/15 text-[var(--cyan)] border-cyan-500/30'
        default:
            return 'bg-[var(--surface2)] text-[var(--text2)] border-[var(--border)]'
    }
}
</script>

<template>
    <div class="card p-4 sm:p-5">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
            <div>
                <h3 class="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                    <UIcon name="i-heroicons-code-bracket-square" class="w-4 h-4 text-[var(--green)]" />
                    <span>{{ $t('waf.waf_rules_title') }}</span>
                    <span class="text-xs font-mono font-normal text-[var(--text3)]">({{ rules.length }})</span>
                </h3>
                <p class="text-xs text-[var(--text3)] mt-0.5">
                    {{ $t('waf.waf_rules_desc') }}
                </p>
            </div>
            <span class="chip green uppercase">RULESETS ENGINE</span>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-10">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
        </div>

        <div v-else-if="!rules.length" class="flex flex-col items-center justify-center py-10 text-[var(--text3)] gap-2">
            <UIcon name="i-heroicons-document-check" class="w-8 h-8 opacity-40 text-[var(--cyan)]" />
            <span class="text-xs">{{ $t('waf.no_waf_rules') }}</span>
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="rule in rules"
                :key="rule.id"
                class="p-3.5 rounded-xl border bg-[var(--surface)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                :class="rule.enabled
                    ? 'border-[var(--border)] hover:border-[var(--green)]/50'
                    : 'border-[var(--border)] opacity-60'"
            >
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-xs text-[var(--text)]">
                            {{ rule.description }}
                        </span>
                        <span
                            class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase"
                            :class="getActionBadge(rule.action)"
                        >
                            {{ rule.action }}
                        </span>
                    </div>
                    <div class="mt-1.5 p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-mono text-[11px] text-[var(--cyan)] truncate">
                        {{ rule.expression }}
                    </div>
                </div>

                <div class="shrink-0 flex items-center gap-2">
                    <button
                        type="button"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border flex items-center gap-1.5"
                        :class="rule.enabled
                            ? 'bg-emerald-500/10 text-[var(--green)] border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-[var(--surface2)] text-[var(--text3)] border-[var(--border)] hover:text-[var(--text)]'"
                        :disabled="togglingId === rule.id"
                        @click="emit('toggle-rule', rule, !rule.enabled)"
                    >
                        <UIcon v-if="togglingId === rule.id" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
                        <span>{{ rule.enabled ? $t('waf.rule_enabled') : $t('waf.rule_disabled') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
