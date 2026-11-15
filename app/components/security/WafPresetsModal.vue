<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WafPreset, WafCustomRule } from '~~/types/security'
import { WAF_PRESETS } from '~~/app/utils/wafPresets'

const props = defineProps<{
    isOpen: boolean
    existingRules: WafCustomRule[]
    applyingId?: string | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'apply', preset: WafPreset): void
    (e: 'customize', preset: WafPreset): void
}>()

const { locale } = useI18n()
const selectedCategory = ref<string>('all')
const searchQuery = ref<string>('')

const categories = [
    { id: 'all', labelKey: 'waf.filter_all' },
    { id: 'threat', labelKey: 'waf.filter_threat' },
    { id: 'bot', labelKey: 'waf.filter_bot' },
    { id: 'cms', labelKey: 'waf.filter_cms' },
    { id: 'compliance', labelKey: 'waf.filter_compliance' }
]

const filteredPresets = computed(() => {
    let list = WAF_PRESETS

    if (selectedCategory.value !== 'all') {
        list = list.filter(p => p.category === selectedCategory.value)
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
        list = list.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.titleTh && p.titleTh.toLowerCase().includes(q)) ||
            p.description.toLowerCase().includes(q) ||
            (p.descriptionTh && p.descriptionTh.toLowerCase().includes(q)) ||
            p.expression.toLowerCase().includes(q)
        )
    }

    return list
})

const isInstalled = (preset: WafPreset): boolean => {
    return props.existingRules.some(r =>
        r.expression.trim() === preset.expression.trim() ||
        r.description.toLowerCase() === preset.title.toLowerCase() ||
        (preset.titleTh && r.description.toLowerCase() === preset.titleTh.toLowerCase())
    )
}

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
    <UModal :open="isOpen" :ui="{ content: 'sm:max-w-3xl' }" @update:open="(val: boolean) => !val && emit('close')">
        <template #content>
            <div class="card card-ref p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-start justify-between pb-3 border-b border-[var(--border)] shrink-0">
                    <div>
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-[var(--green)]" />
                            <h3 class="font-bold text-base text-[var(--text)]">
                                {{ $t('waf.presets_modal_title') }}
                            </h3>
                        </div>
                        <p class="text-xs text-[var(--text3)] mt-1">
                            {{ $t('waf.presets_modal_desc') }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="p-1 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                        @click="emit('close')"
                    >
                        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                    </button>
                </div>

                <!-- Filter & Search Controls -->
                <div class="space-y-3 shrink-0">
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <!-- Search Box -->
                        <div class="relative flex-1">
                            <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)] absolute left-3 top-2.5" />
                            <input
                                v-model="searchQuery"
                                type="text"
                                :placeholder="$t('waf.search_presets')"
                                class="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                            />
                            <button
                                v-if="searchQuery"
                                type="button"
                                class="absolute right-2.5 top-2.5 text-[var(--text3)] hover:text-[var(--text)]"
                                @click="searchQuery = ''"
                            >
                                <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <!-- Limit Hint -->
                        <div class="flex items-center gap-1.5 text-[11px] text-[var(--text3)] bg-[var(--surface2)] px-2.5 py-1.5 rounded-lg border border-[var(--border)]">
                            <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5 text-[var(--cyan)] shrink-0" />
                            <span>{{ $t('waf.rules_limit_hint') }}</span>
                        </div>
                    </div>

                    <!-- Category Pills -->
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            v-for="cat in categories"
                            :key="cat.id"
                            type="button"
                            class="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border"
                            :class="selectedCategory === cat.id
                                ? 'bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/40 font-semibold'
                                : 'bg-[var(--surface)] text-[var(--text3)] border-[var(--border)] hover:text-[var(--text)]'"
                            @click="selectedCategory = cat.id"
                        >
                            {{ $t(cat.labelKey) }}
                        </button>
                    </div>
                </div>

                <!-- Presets List (Scrollable) -->
                <div class="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
                    <div v-if="!filteredPresets.length" class="flex flex-col items-center justify-center py-12 text-[var(--text3)] gap-2">
                        <UIcon name="i-heroicons-funnel" class="w-8 h-8 opacity-40 text-[var(--cyan)]" />
                        <span class="text-xs">{{ $t('waf.no_presets_found') }}</span>
                    </div>

                    <div
                        v-for="preset in filteredPresets"
                        :key="preset.id"
                        class="p-4 rounded-xl border bg-[var(--surface)] hover:border-[var(--border)] transition-all flex flex-col gap-3 group"
                        :class="isInstalled(preset) ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-[var(--border)]'"
                    >
                        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5 text-[var(--cyan)]">
                                    <UIcon :name="preset.icon" class="w-5 h-5" />
                                </div>
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <h4 class="font-bold text-xs sm:text-sm text-[var(--text)]">
                                            {{ locale === 'th' && preset.titleTh ? preset.titleTh : preset.title }}
                                        </h4>
                                        <span
                                            v-if="preset.badge"
                                            class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-emerald-500/10 text-[var(--green)] border border-emerald-500/30"
                                        >
                                            {{ preset.badge }}
                                        </span>
                                        <span
                                            class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase"
                                            :class="getActionBadge(preset.action)"
                                        >
                                            {{ preset.action }}
                                        </span>
                                    </div>
                                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                                        {{ locale === 'th' && preset.descriptionTh ? preset.descriptionTh : preset.description }}
                                    </p>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                                <div v-if="isInstalled(preset)" class="flex items-center gap-1 text-[11px] font-semibold text-[var(--green)] bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                                    <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" />
                                    <span>{{ $t('waf.preset_installed') }}</span>
                                </div>
                                <button
                                    v-else
                                    type="button"
                                    class="btn-primary py-1 px-3 text-xs font-semibold flex items-center gap-1.5"
                                    :disabled="applyingId === preset.id"
                                    @click="emit('apply', preset)"
                                >
                                    <UIcon v-if="applyingId === preset.id" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
                                    <UIcon v-else name="i-heroicons-bolt" class="w-3.5 h-3.5" />
                                    <span>{{ $t('waf.apply_preset') }}</span>
                                </button>

                                <button
                                    type="button"
                                    class="text-[11px] text-[var(--text3)] hover:text-[var(--text)] transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--surface2)]"
                                    @click="emit('customize', preset)"
                                >
                                    <UIcon name="i-heroicons-adjustments-horizontal" class="w-3 h-3" />
                                    <span>{{ $t('waf.customize_preset') }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Expression Code Preview -->
                        <div class="mt-1 p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-mono text-[11px] text-[var(--cyan)] break-all leading-normal">
                            {{ preset.expression }}
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="pt-3 border-t border-[var(--border)] flex justify-end shrink-0">
                    <button
                        type="button"
                        class="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                        @click="emit('close')"
                    >
                        {{ $t('common.close') }}
                    </button>
                </div>
            </div>
        </template>
    </UModal>
</template>
