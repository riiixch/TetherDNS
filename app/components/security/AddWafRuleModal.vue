<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WafCustomRule } from '~~/types/security'
import { WAF_SNIPPET_HELPERS } from '~~/app/utils/wafPresets'

const props = defineProps<{
    isOpen: boolean
    loading?: boolean
    initialData?: Partial<WafCustomRule> | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', payload: { description: string; expression: string; action: string; enabled: boolean }): void
    (e: 'open-presets'): void
}>()

const { t } = useI18n()
const toast = useToast()

const description = ref('')
const expression = ref('')
const action = ref<string>('block')
const enabled = ref(true)

watch(() => props.isOpen, (open) => {
    if (open) {
        if (props.initialData) {
            description.value = props.initialData.description || ''
            expression.value = props.initialData.expression || ''
            action.value = props.initialData.action || 'block'
            enabled.value = props.initialData.enabled !== false
        } else {
            description.value = ''
            expression.value = ''
            action.value = 'block'
            enabled.value = true
        }
    }
})

const actionOptions = [
    { value: 'block', labelKey: 'waf.action_block', color: 'text-[var(--danger)]' },
    { value: 'managed_challenge', labelKey: 'waf.action_managed_challenge', color: 'text-[var(--amber)]' },
    { value: 'js_challenge', labelKey: 'waf.action_js_challenge', color: 'text-[var(--cyan)]' },
    { value: 'challenge', labelKey: 'waf.action_challenge', color: 'text-orange-400' },
    { value: 'log', labelKey: 'waf.action_log', color: 'text-[var(--text2)]' }
]

const insertSnippet = (snippet: string) => {
    if (!expression.value) {
        expression.value = snippet
    } else {
        expression.value += ` and ${snippet}`
    }
}

const handleSubmit = () => {
    const desc = description.value.trim()
    const expr = expression.value.trim()

    if (!desc || !expr) {
        toast.add({
            title: t('common.failed'),
            description: 'Please fill in both rule name and expression.',
            color: 'error'
        })
        return
    }

    // Basic syntax check: matching parentheses
    const openParen = (expr.match(/\(/g) || []).length
    const closeParen = (expr.match(/\)/g) || []).length
    if (openParen !== closeParen) {
        toast.add({
            title: t('common.failed'),
            description: `Expression has unmatched parentheses (${openParen} '(' vs ${closeParen} ')').`,
            color: 'error'
        })
        return
    }

    emit('submit', {
        description: desc,
        expression: expr,
        action: action.value,
        enabled: enabled.value
    })
}

const handleClose = () => {
    description.value = ''
    expression.value = ''
    emit('close')
}
</script>

<template>
    <UModal :open="isOpen" :ui="{ content: 'sm:max-w-xl' }" @update:open="(val: boolean) => !val && handleClose()">
        <template #content>
            <div class="card card-ref p-5 sm:p-6 space-y-4">
                <!-- Header -->
                <div class="flex items-start justify-between pb-3 border-b border-[var(--border)]">
                    <div>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-[var(--green)]" />
                            <h3 class="font-bold text-base text-[var(--text)]">
                                {{ $t('waf.add_waf_modal_title') }}
                            </h3>
                        </div>
                        <p class="text-xs text-[var(--text3)] mt-1">
                            {{ $t('waf.add_waf_modal_desc') }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="p-1 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                        @click="handleClose"
                    >
                        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                    </button>
                </div>

                <!-- Form -->
                <form class="space-y-4" @submit.prevent="handleSubmit">
                    <!-- Rule Description -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-xs font-semibold text-[var(--text2)]">
                                {{ $t('waf.rule_desc_label') }}
                            </label>
                            <button
                                type="button"
                                class="text-[11px] text-[var(--cyan)] hover:underline flex items-center gap-1"
                                @click="emit('open-presets')"
                            >
                                <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
                                <span>{{ $t('waf.presets_btn') }}</span>
                            </button>
                        </div>
                        <input
                            v-model="description"
                            type="text"
                            required
                            :placeholder="$t('waf.rule_desc_placeholder')"
                            class="w-full px-3 py-2 rounded-xl text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                        />
                    </div>

                    <!-- Action Selector -->
                    <div>
                        <label class="block text-xs font-semibold text-[var(--text2)] mb-1">
                            {{ $t('waf.rule_action_label') }}
                        </label>
                        <select
                            v-model="action"
                            class="w-full px-3 py-2 rounded-xl text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                        >
                            <option
                                v-for="opt in actionOptions"
                                :key="opt.value"
                                :value="opt.value"
                            >
                                {{ $t(opt.labelKey) }}
                            </option>
                        </select>
                    </div>

                    <!-- Wirefilter Expression -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-xs font-semibold text-[var(--text2)]">
                                {{ $t('waf.rule_expr_label') }}
                            </label>
                            <span class="text-[11px] text-[var(--text3)] font-mono">Cloudflare Wirefilter</span>
                        </div>
                        <textarea
                            v-model="expression"
                            rows="4"
                            required
                            :placeholder="$t('waf.rule_expr_placeholder')"
                            class="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--cyan)] focus:border-[var(--green)] outline-none resize-none leading-relaxed"
                        ></textarea>

                        <!-- Snippet Helpers -->
                        <div class="mt-2 space-y-1">
                            <span class="text-[10px] font-semibold text-[var(--text3)] uppercase tracking-wider">
                                {{ $t('waf.quick_helpers') }}
                            </span>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <button
                                    v-for="helper in WAF_SNIPPET_HELPERS"
                                    :key="helper.label"
                                    type="button"
                                    class="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--cyan)]/40 transition-colors"
                                    @click="insertSnippet(helper.snippet)"
                                >
                                    + {{ helper.label }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Rule Enabled State -->
                    <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                        <div>
                            <span class="text-xs font-semibold text-[var(--text)] block">
                                {{ $t('waf.rule_status_label') }}
                            </span>
                            <span class="text-[11px] text-[var(--text3)]">
                                {{ enabled ? $t('waf.rule_enabled') : $t('waf.rule_disabled') }}
                            </span>
                        </div>
                        <input
                            v-model="enabled"
                            type="checkbox"
                            class="w-4 h-4 rounded text-[var(--green)] focus:ring-0 cursor-pointer"
                        />
                    </div>

                    <!-- Footer Buttons -->
                    <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                        <button
                            type="button"
                            class="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                            @click="handleClose"
                        >
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="submit"
                            class="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
                            :disabled="loading"
                        >
                            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                            <UIcon v-else name="i-heroicons-cloud-arrow-up" class="w-4 h-4" />
                            <span>{{ $t('waf.btn_save_waf') }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </UModal>
</template>
