<script setup lang="ts">
import { ref, computed } from 'vue'
import type { IpAccessRule } from '~~/types/security'

const props = defineProps<{
    rules: IpAccessRule[]
    loading?: boolean
    deletingId?: string | null
}>()

const emit = defineEmits<{
    (e: 'add-rule'): void
    (e: 'delete-rule', ruleId: string): void
}>()

const searchQuery = ref('')
const confirmDeleteId = ref<string | null>(null)

const filteredRules = computed(() => {
    let list = props.rules || []
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase().trim()
        list = list.filter(r =>
            r.value.toLowerCase().includes(q) ||
            r.notes.toLowerCase().includes(q) ||
            r.target.toLowerCase().includes(q) ||
            r.mode.toLowerCase().includes(q)
        )
    }
    return list
})

const getActionColor = (mode: string) => {
    switch (mode) {
        case 'block':
            return 'bg-red-500/15 text-[var(--danger)] border-red-500/30'
        case 'challenge':
        case 'managed_challenge':
            return 'bg-amber-500/15 text-[var(--amber)] border-amber-500/30'
        case 'js_challenge':
            return 'bg-cyan-500/15 text-[var(--cyan)] border-cyan-500/30'
        case 'whitelist':
            return 'bg-emerald-500/15 text-[var(--green)] border-emerald-500/30'
        default:
            return 'bg-[var(--surface2)] text-[var(--text2)] border-[var(--border)]'
    }
}

const getTargetBadge = (target: string) => {
    switch (target) {
        case 'ip':
            return { label: 'IP', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
        case 'ip_range':
            return { label: 'CIDR', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
        case 'country':
            return { label: 'GEO', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
        case 'asn':
            return { label: 'ASN', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
        default:
            return { label: target.toUpperCase(), class: 'bg-[var(--surface2)] text-[var(--text3)] border-[var(--border)]' }
    }
}

const getCountryFlag = (cc: string) => {
    if (!cc || cc.length !== 2) return ''
    try {
        const codePoints = cc.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
        return String.fromCodePoint(...codePoints)
    } catch {
        return ''
    }
}

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return dateStr
    }
}

const handleDelete = (ruleId: string) => {
    confirmDeleteId.value = null
    emit('delete-rule', ruleId)
}
</script>

<template>
    <div class="card p-4 sm:p-5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[var(--border)]">
            <div>
                <h3 class="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                    <UIcon name="i-heroicons-shield-exclamation" class="w-4 h-4 text-[var(--danger)]" />
                    <span>{{ $t('waf.ip_rules_title') }}</span>
                    <span class="text-xs font-mono font-normal text-[var(--text3)]">({{ rules.length }})</span>
                </h3>
                <p class="text-xs text-[var(--text3)] mt-0.5">
                    {{ $t('waf.ip_rules_desc') }}
                </p>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
                <div class="relative flex-1 sm:w-56">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-[var(--text3)] absolute left-3 top-2.5" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        :placeholder="$t('waf.search_rules_placeholder')"
                        class="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--green)] outline-none"
                    />
                </div>
                <button
                    type="button"
                    class="btn-ref primary text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 shrink-0"
                    @click="emit('add-rule')"
                >
                    <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                    <span>{{ $t('waf.btn_add_ip_rule') }}</span>
                </button>
            </div>
        </div>

        <!-- Table View -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
        </div>

        <div v-else-if="!filteredRules.length" class="flex flex-col items-center justify-center py-12 text-[var(--text3)] gap-2">
            <UIcon name="i-heroicons-shield-check" class="w-8 h-8 opacity-40 text-[var(--green)]" />
            <span class="text-xs">{{ $t('waf.no_ip_rules') }}</span>
        </div>

        <div v-else class="w-full">
            <!-- Desktop Table (hidden on mobile < 768px) -->
            <div class="table-wrap overflow-x-auto hidden md:block">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="border-b border-[var(--border)] text-[var(--text3)] font-mono text-[11px] uppercase tracking-wider">
                            <th class="py-2.5 px-3">{{ $t('waf.col_target') }}</th>
                            <th class="py-2.5 px-3">{{ $t('waf.col_action') }}</th>
                            <th class="py-2.5 px-3">{{ $t('waf.col_notes') }}</th>
                            <th class="py-2.5 px-3">{{ $t('waf.col_created') }}</th>
                            <th class="py-2.5 px-3 text-right">{{ $t('waf.col_actions') }}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border)]">
                        <tr
                            v-for="rule in filteredRules"
                            :key="rule.id"
                            class="hover:bg-[var(--surface2)]/60 transition-colors"
                        >
                            <!-- Target (IP/Country/ASN) -->
                            <td class="py-3 px-3">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border"
                                        :class="getTargetBadge(rule.target).class"
                                    >
                                        {{ getTargetBadge(rule.target).label }}
                                    </span>
                                    <span v-if="rule.target === 'country'" class="text-sm select-none" :title="rule.value">
                                        {{ getCountryFlag(rule.value) }}
                                    </span>
                                    <span class="font-mono font-semibold text-[var(--text)]">
                                        {{ rule.value }}
                                    </span>
                                </div>
                            </td>

                            <!-- Action -->
                            <td class="py-3 px-3">
                                <span
                                    class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase"
                                    :class="getActionColor(rule.mode)"
                                >
                                    {{ rule.mode.replace(/_/g, ' ') }}
                                </span>
                            </td>

                            <!-- Notes -->
                            <td class="py-3 px-3 text-[var(--text2)] max-w-xs truncate">
                                {{ rule.notes || '-' }}
                            </td>

                            <!-- Created On -->
                            <td class="py-3 px-3 text-[var(--text3)] font-mono text-[11px] whitespace-nowrap">
                                {{ formatDate(rule.createdOn) }}
                            </td>

                            <!-- Action Buttons -->
                            <td class="py-3 px-3 text-right">
                                <div v-if="confirmDeleteId === rule.id" class="flex items-center justify-end gap-1.5">
                                    <button
                                        type="button"
                                        class="px-2 py-1 rounded text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
                                        :disabled="deletingId === rule.id"
                                        @click="handleDelete(rule.id)"
                                    >
                                        <UIcon v-if="deletingId === rule.id" name="i-heroicons-arrow-path" class="w-3 h-3 animate-spin" />
                                        <span v-else>{{ $t('common.delete') }}</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="px-2 py-1 rounded text-[11px] text-[var(--text3)] hover:text-[var(--text)]"
                                        @click="confirmDeleteId = null"
                                    >
                                        {{ $t('common.cancel') }}
                                    </button>
                                </div>
                                <button
                                    v-else
                                    type="button"
                                    class="p-1.5 rounded-lg text-[var(--text3)] hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors"
                                    :title="$t('common.delete')"
                                    @click="confirmDeleteId = rule.id"
                                >
                                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Mobile Rules Cards List (shown only on mobile < 768px) -->
            <div class="ip-rules-mobile-list block md:hidden divide-y divide-[var(--border)]">
                <div
                    v-for="rule in filteredRules"
                    :key="'mob-' + rule.id"
                    class="p-3.5 space-y-2.5 hover:bg-[var(--surface2)]/50 transition-colors"
                >
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                            <span
                                class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border shrink-0"
                                :class="getTargetBadge(rule.target).class"
                            >
                                {{ getTargetBadge(rule.target).label }}
                            </span>
                            <span v-if="rule.target === 'country'" class="text-sm select-none shrink-0" :title="rule.value">
                                {{ getCountryFlag(rule.value) }}
                            </span>
                            <span class="font-mono font-bold text-sm text-[var(--text)] truncate">
                                {{ rule.value }}
                            </span>
                        </div>
                        <span
                            class="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase shrink-0"
                            :class="getActionColor(rule.mode)"
                        >
                            {{ rule.mode.replace(/_/g, ' ') }}
                        </span>
                    </div>

                    <p v-if="rule.notes" class="text-xs text-[var(--text2)] line-clamp-2">
                        {{ rule.notes }}
                    </p>

                    <div class="flex items-center justify-between pt-1 text-[11px] text-[var(--text3)]">
                        <span class="font-mono">{{ formatDate(rule.createdOn) }}</span>
                        <div v-if="confirmDeleteId === rule.id" class="flex items-center gap-1.5">
                            <button
                                type="button"
                                class="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white"
                                :disabled="deletingId === rule.id"
                                @click="handleDelete(rule.id)"
                            >
                                {{ $t('common.delete') }}
                            </button>
                            <button
                                type="button"
                                class="px-2 py-0.5 rounded text-[11px] text-[var(--text3)]"
                                @click="confirmDeleteId = null"
                            >
                                {{ $t('common.cancel') }}
                            </button>
                        </div>
                        <button
                            v-else
                            type="button"
                            class="p-1 rounded text-[var(--text3)] hover:text-[var(--danger)]"
                            @click="confirmDeleteId = rule.id"
                        >
                            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
