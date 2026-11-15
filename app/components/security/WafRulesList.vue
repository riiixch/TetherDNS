<script setup lang="ts">
import { ref } from 'vue'
import type { WafCustomRule } from '~~/types/security'

const props = defineProps<{
    rules: WafCustomRule[]
    loading?: boolean
    togglingId?: string | null
    deletingId?: string | null
}>()

const emit = defineEmits<{
    (e: 'toggle-rule', rule: WafCustomRule, nextState: boolean): void
    (e: 'delete-rule', rule: WafCustomRule): void
    (e: 'add-rule'): void
    (e: 'open-presets'): void
}>()

const { t } = useI18n()
const toast = useToast()

const ruleToDelete = ref<WafCustomRule | null>(null)
const isDeleteModalOpen = ref(false)
const copiedId = ref<string | null>(null)

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

const copyExpression = async (rule: WafCustomRule) => {
    try {
        await navigator.clipboard.writeText(rule.expression)
        copiedId.value = rule.id
        toast.add({
            title: t('common.success'),
            description: t('waf.copied_expr'),
            color: 'success'
        })
        setTimeout(() => {
            if (copiedId.value === rule.id) copiedId.value = null
        }, 2000)
    } catch {
        // Fallback
    }
}

const confirmDelete = (rule: WafCustomRule) => {
    ruleToDelete.value = rule
    isDeleteModalOpen.value = true
}

const executeDelete = () => {
    if (ruleToDelete.value) {
        emit('delete-rule', ruleToDelete.value)
        isDeleteModalOpen.value = false
        ruleToDelete.value = null
    }
}
</script>

<template>
    <div class="card p-4 sm:p-5">
        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[var(--border)] gap-3">
            <div>
                <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                        <UIcon name="i-heroicons-code-bracket-square" class="w-4 h-4 text-[var(--green)]" />
                        <span>{{ $t('waf.waf_rules_title') }}</span>
                    </h3>
                    <span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[var(--surface2)] border border-[var(--border)] text-[var(--cyan)]">
                        {{ $t('waf.rules_count_badge', { count: rules.length }) }}
                    </span>
                    <span class="chip green uppercase text-[10px]">RULESETS ENGINE</span>
                </div>
                <p class="text-xs text-[var(--text3)] mt-1">
                    {{ $t('waf.waf_rules_desc') }}
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-[var(--green)] border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                    @click="emit('open-presets')"
                >
                    <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
                    <span>{{ $t('waf.presets_btn') }}</span>
                </button>
                <button
                    type="button"
                    class="btn-primary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    @click="emit('add-rule')"
                >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                    <span>{{ $t('waf.btn_add_waf_rule') }}</span>
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-10">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
        </div>

        <!-- Empty State -->
        <div v-else-if="!rules.length" class="flex flex-col items-center justify-center py-12 text-[var(--text3)] gap-3 text-center">
            <div class="w-12 h-12 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[var(--cyan)]">
                <UIcon name="i-heroicons-shield-exclamation" class="w-6 h-6" />
            </div>
            <div>
                <p class="text-xs font-semibold text-[var(--text)]">{{ $t('waf.no_waf_rules') }}</p>
                <p class="text-[11px] text-[var(--text3)] mt-0.5 max-w-sm">
                    {{ $t('waf.presets_modal_desc') }}
                </p>
            </div>
            <div class="flex items-center gap-2 mt-2">
                <button
                    type="button"
                    class="btn-primary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5"
                    @click="emit('open-presets')"
                >
                    <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
                    <span>{{ $t('waf.presets_btn') }}</span>
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                    @click="emit('add-rule')"
                >
                    {{ $t('waf.btn_add_waf_rule') }}
                </button>
            </div>
        </div>

        <!-- Rules List -->
        <div v-else class="space-y-3">
            <div
                v-for="rule in rules"
                :key="rule.id"
                class="p-4 rounded-xl border bg-[var(--surface)] transition-all flex flex-col gap-3 group"
                :class="rule.enabled
                    ? 'border-[var(--border)] hover:border-[var(--green)]/50'
                    : 'border-[var(--border)] opacity-65'"
            >
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-semibold text-xs sm:text-sm text-[var(--text)]">
                                {{ rule.description }}
                            </span>
                            <span
                                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase"
                                :class="getActionBadge(rule.action)"
                            >
                                {{ rule.action }}
                            </span>
                        </div>
                    </div>

                    <!-- Toggle & Delete Buttons -->
                    <div class="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                        <!-- Toggle Status Button -->
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

                        <!-- Delete Button -->
                        <button
                            type="button"
                            class="p-1.5 rounded-lg text-[var(--text3)] hover:text-[var(--danger)] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            :title="$t('common.delete')"
                            :disabled="deletingId === rule.id"
                            @click="confirmDelete(rule)"
                        >
                            <UIcon v-if="deletingId === rule.id" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-[var(--danger)]" />
                            <UIcon v-else name="i-heroicons-trash" class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- Expression Bar with Copy -->
                <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-mono text-[11px] text-[var(--cyan)]">
                    <span class="truncate flex-1">{{ rule.expression }}</span>
                    <button
                        type="button"
                        class="p-1 rounded text-[var(--text3)] hover:text-[var(--text)] shrink-0 transition-colors"
                        :title="$t('waf.copy_expr')"
                        @click="copyExpression(rule)"
                    >
                        <UIcon :name="copiedId === rule.id ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'" class="w-3.5 h-3.5" :class="copiedId === rule.id ? 'text-[var(--green)]' : ''" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <UModal :open="isDeleteModalOpen" :ui="{ content: 'sm:max-w-md' }" @update:open="(val: boolean) => !val && (isDeleteModalOpen = false)">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center gap-3 text-[var(--danger)]">
                        <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                        </div>
                        <div>
                            <h3 class="font-bold text-sm text-[var(--text)]">
                                {{ $t('waf.delete_confirm_title') }}
                            </h3>
                            <p class="text-xs text-[var(--text3)] mt-0.5">
                                {{ ruleToDelete?.description }}
                            </p>
                        </div>
                    </div>
                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        {{ $t('waf.delete_confirm_desc') }}
                    </p>
                    <div class="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                        <button
                            type="button"
                            class="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                            @click="isDeleteModalOpen = false"
                        >
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="button"
                            class="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5"
                            @click="executeDelete"
                        >
                            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            <span>{{ $t('common.delete') }}</span>
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
