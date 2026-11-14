<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AccessRuleMode, AccessRuleTarget } from '~~/types/security'

const props = defineProps<{
    isOpen: boolean
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', payload: { mode: AccessRuleMode; target: AccessRuleTarget; value: string; notes?: string }): void
}>()

const { t } = useI18n()
const toast = useToast()

const target = ref<AccessRuleTarget>('ip')
const mode = ref<AccessRuleMode>('block')
const value = ref('')
const notes = ref('')

watch(() => props.isOpen, (open) => {
    if (open) {
        value.value = ''
        notes.value = ''
        target.value = 'ip'
        mode.value = 'block'
    }
})

const targetOptions: Array<{ value: AccessRuleTarget; label: string }> = [
    { value: 'ip', label: 'waf.target_ip' },
    { value: 'ip_range', label: 'waf.target_ip_range' },
    { value: 'country', label: 'waf.target_country' },
    { value: 'asn', label: 'waf.target_asn' }
]

const modeOptions: Array<{ value: AccessRuleMode; label: string; color: string }> = [
    { value: 'block', label: 'waf.action_block', color: 'text-[var(--danger)]' },
    { value: 'managed_challenge', label: 'waf.action_managed_challenge', color: 'text-[var(--amber)]' },
    { value: 'challenge', label: 'waf.action_challenge', color: 'text-orange-400' },
    { value: 'js_challenge', label: 'waf.action_js_challenge', color: 'text-[var(--cyan)]' },
    { value: 'whitelist', label: 'waf.action_whitelist', color: 'text-[var(--green)]' }
]

const placeholderMap: Record<AccessRuleTarget, string> = {
    ip: '198.51.100.4',
    ip_range: '203.0.113.0/24',
    country: 'TH',
    asn: 'AS13335'
}

const handleSubmit = () => {
    const val = value.value.trim()
    if (!val) return
    if (target.value === 'country' && val.length !== 2) {
        toast.add({
            title: t('common.failed'),
            description: t('waf.hint_country'),
            color: 'error'
        })
        return
    }
    emit('submit', {
        target: target.value,
        mode: mode.value,
        value: val,
        notes: notes.value.trim() || undefined
    })
}

const handleClose = () => {
    value.value = ''
    notes.value = ''
    emit('close')
}
</script>

<template>
    <UModal :open="isOpen" :ui="{ content: 'sm:max-w-md' }" @update:open="(val: boolean) => !val && handleClose()">
        <template #content>
            <div class="card card-ref p-6 space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-[var(--danger)]" />
                        <h3 class="font-bold text-base text-[var(--text)]">
                            {{ $t('waf.add_modal_title') }}
                        </h3>
                    </div>
                    <button
                        type="button"
                        class="text-[var(--text3)] hover:text-[var(--text)]"
                        @click="handleClose"
                    >
                        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="handleSubmit">
                    <!-- Target Type Selector -->
                    <div>
                        <label class="block text-xs font-semibold text-[var(--text2)] mb-1">
                            {{ $t('waf.target_type') }}
                        </label>
                        <select
                            v-model="target"
                            class="w-full px-3 py-2 rounded-xl text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                        >
                            <option
                                v-for="tOpt in targetOptions"
                                :key="tOpt.value"
                                :value="tOpt.value"
                            >
                                {{ $t(tOpt.label) }}
                            </option>
                        </select>
                    </div>

                    <!-- Target Value Input -->
                    <div>
                        <label class="block text-xs font-semibold text-[var(--text2)] mb-1">
                            {{ $t('waf.target_value') }}
                        </label>
                        <input
                            v-model="value"
                            type="text"
                            required
                            :maxlength="target === 'country' ? 2 : undefined"
                            :placeholder="placeholderMap[target]"
                            class="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                            @input="target === 'country' ? value = value.toUpperCase() : null"
                        />
                        <p v-if="target === 'country'" class="text-[11px] text-[var(--text3)] mt-1">
                            {{ $t('waf.hint_country') }}
                        </p>
                        <p v-else-if="target === 'ip_range'" class="text-[11px] text-[var(--text3)] mt-1">
                            {{ $t('waf.hint_ip_range') }}
                        </p>
                        <p v-else-if="target === 'asn'" class="text-[11px] text-[var(--text3)] mt-1">
                            {{ $t('waf.hint_asn') }}
                        </p>
                    </div>

                    <!-- Action Selector -->
                    <div>
                        <label class="block text-xs font-semibold text-[var(--text2)] mb-1">
                            {{ $t('waf.col_action') }}
                        </label>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                v-for="(mOpt, idx) in modeOptions"
                                :key="mOpt.value"
                                type="button"
                                class="px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between"
                                :class="[
                                    mode === mOpt.value
                                        ? 'bg-[var(--surface2)] border-[var(--green)] text-[var(--text)] ring-1 ring-[var(--green)]'
                                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] opacity-80 hover:opacity-100',
                                    idx === 4 ? 'col-span-2' : ''
                                ]"
                                @click="mode = mOpt.value"
                            >
                                <span :class="mOpt.color">{{ $t(mOpt.label) }}</span>
                                <span v-if="mode === mOpt.value" class="w-1.5 h-1.5 rounded-full bg-[var(--green)]"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Notes Input -->
                    <div>
                        <label class="block text-xs font-semibold text-[var(--text2)] mb-1">
                            {{ $t('waf.col_notes') }}
                        </label>
                        <input
                            v-model="notes"
                            type="text"
                            :placeholder="$t('waf.notes_placeholder')"
                            class="w-full px-3 py-2 rounded-xl text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                        />
                    </div>

                    <!-- Modal Actions -->
                    <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                        <button
                            type="button"
                            class="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text2)] hover:bg-[var(--surface2)] transition-colors"
                            @click="handleClose"
                        >
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="submit"
                            class="btn-ref primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                            :disabled="loading || !value.trim()"
                        >
                            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                            <span>{{ $t('common.save') }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </UModal>
</template>
