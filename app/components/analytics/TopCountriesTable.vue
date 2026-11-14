<script setup lang="ts">
import { computed } from 'vue'
import type { ZoneAnalyticsCountry } from '~~/types/analytics'

const props = defineProps<{
    countries?: ZoneAnalyticsCountry[]
    loading?: boolean
}>()

const items = computed(() => props.countries || [])

// Native region name resolver
const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

const getCountryName = (code: string, fallbackName?: string) => {
    if (!code) return 'Unknown'
    const upper = code.toUpperCase().trim()
    // Common overrides
    if (upper === 'HK') return 'Hong Kong'
    if (upper === 'TW') return 'Taiwan'
    if (upper === 'MO') return 'Macau'
    if (upper === 'T1') return 'Tor Network'
    if (upper === 'XX') return 'Unknown Proxy'
    try {
        if (regionNames && upper.length === 2) {
            return regionNames.of(upper) || fallbackName || upper
        }
    } catch {
        /* fallback */
    }
    return fallbackName || upper
}
</script>

<template>
    <div class="card flex flex-col h-full">
        <div class="card-head">
            <div class="card-title">
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-[var(--cyan)]" />
                <span>{{ $t('analytics.top_traffic_countries') }}</span>
            </div>
            <span class="chip cyan">GEOGRAPHY</span>
        </div>

        <div class="card-body flex-1 overflow-y-auto">
            <div v-if="loading" class="flex items-center justify-center py-10">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--text3)]" />
            </div>
            <div v-else-if="!items.length" class="flex flex-col items-center justify-center text-[var(--text3)] gap-2 py-10">
                <UIcon name="i-heroicons-map-pin" class="w-8 h-8 opacity-40" />
                <span class="text-xs">{{ $t('analytics.no_country_data') }}</span>
            </div>
            <div v-else class="space-y-3.5">
                <div
                    v-for="(item, idx) in items.slice(0, 6)"
                    :key="item.country || idx"
                    class="flex flex-col gap-1.5 text-xs"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 truncate">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-[var(--surface2)] text-[var(--cyan)] border border-[var(--border)] uppercase select-none">
                                {{ item.country }}
                            </span>
                            <span class="font-medium text-[var(--text1)] truncate">
                                {{ getCountryName(item.country, item.name) }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2 mono shrink-0">
                            <span class="text-[var(--text2)]">{{ new Intl.NumberFormat().format(item.requests) }}</span>
                            <span class="text-[var(--cyan)] font-semibold w-12 text-right">{{ item.percentage }}%</span>
                        </div>
                    </div>
                    <!-- Progress bar -->
                    <div class="w-full bg-[var(--surface2)] rounded-full h-1.5 overflow-hidden">
                        <div
                            class="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] rounded-full transition-all duration-500"
                            :style="{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
