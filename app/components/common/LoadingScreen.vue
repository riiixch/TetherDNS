<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        fullscreen?: boolean
        title?: string
        subtitle?: string
        message?: string
        progress?: number | null
        showTelemetry?: boolean
        compact?: boolean
    }>(),
    {
        fullscreen: true,
        title: 'TetherDNS',
        subtitle: 'Cloudflare DDNS & Edge Manager',
        message: '',
        progress: null,
        showTelemetry: true,
        compact: false
    }
)

const { t } = useI18n()

const displayMessage = computed(() => {
    return props.message || t('common.loading')
})

const hasProgress = computed(() => {
    return typeof props.progress === 'number' && props.progress >= 0 && props.progress <= 100
})
</script>

<template>
    <div
        :class="[
            'loading-screen-root flex flex-col items-center justify-center select-none',
            fullscreen ? 'fixed inset-0 z-[9999] overflow-hidden bg-[var(--bg)]' : 'relative w-full py-12 px-4'
        ]"
    >
        <!-- Ambient animated backdrop for fullscreen mode matching ref.html -->
        <div v-if="fullscreen" class="ambient" aria-hidden="true">
            <div class="blobs">
                <div class="blob b1"></div>
                <div class="blob b2"></div>
                <div class="blob b3"></div>
            </div>
            <div class="grid-bg"></div>
            <div class="grain"></div>
        </div>

        <!-- Central Loading Hero Container -->
        <div
            :class="[
                'relative z-10 flex flex-col items-center text-center max-w-sm w-full mx-auto',
                compact ? 'gap-3' : 'gap-5'
            ]"
        >
            <!-- High-tech Concentric Radar & Holographic Logo -->
            <div
                :class="[
                    'relative flex items-center justify-center',
                    compact ? 'w-20 h-20' : 'w-32 h-32'
                ]"
            >
                <!-- Outer rotating dashed tech ring -->
                <svg
                    class="absolute inset-0 w-full h-full animate-[spin_14s_linear_infinite] text-[var(--border2)] opacity-80 pointer-events-none"
                    viewBox="0 0 120 120"
                    fill="none"
                >
                    <circle
                        cx="60"
                        cy="60"
                        r="56"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-dasharray="6 8"
                    />
                </svg>

                <!-- Middle rotating neon gradient ring -->
                <svg
                    class="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-[spin_6s_linear_infinite_reverse] text-[var(--green)] pointer-events-none"
                    viewBox="0 0 100 100"
                    fill="none"
                >
                    <defs>
                        <linearGradient id="neonRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="var(--green)" stop-opacity="0.9" />
                            <stop offset="50%" stop-color="var(--cyan)" stop-opacity="0.3" />
                            <stop offset="100%" stop-color="transparent" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        stroke="url(#neonRingGrad)"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-dasharray="80 180"
                    />
                </svg>

                <!-- Soft pulsating radar glow behind the logo -->
                <div class="absolute inset-4 rounded-3xl bg-[var(--glow)] opacity-35 blur-xl animate-pulse"></div>

                <!-- Central Glassmorphism Logo Box -->
                <div
                    :class="[
                        'relative flex items-center justify-center rounded-2xl bg-[var(--card-bg)] border border-[var(--border2)] shadow-xl backdrop-blur-md transition-transform',
                        compact ? 'w-14 h-14' : 'w-20 h-20'
                    ]"
                >
                    <img
                        src="~/assets/images/tetherdns_logo.png"
                        alt="TetherDNS Logo"
                        :class="[
                            'object-contain drop-shadow-[0_0_12px_rgba(18,224,138,0.5)] animate-[pulse_2.5s_ease-in-out_infinite]',
                            compact ? 'w-8 h-8' : 'w-11 h-11'
                        ]"
                    />
                    
                    <!-- Corner accent highlights -->
                    <span class="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[var(--green)] rounded-tl-sm opacity-60"></span>
                    <span class="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-[var(--green)] rounded-tr-sm opacity-60"></span>
                    <span class="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-[var(--green)] rounded-bl-sm opacity-60"></span>
                    <span class="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[var(--green)] rounded-br-sm opacity-60"></span>
                </div>
            </div>

            <!-- Brand Heading & Subtitle -->
            <div class="space-y-1">
                <h1
                    v-if="title"
                    :class="[
                        'font-bold font-[\'Space_Grotesk\'] text-[var(--text)] tracking-tight leading-tight',
                        compact ? 'text-lg' : 'text-2xl'
                    ]"
                >
                    {{ title }}
                </h1>
                <p
                    v-if="subtitle"
                    :class="[
                        'font-semibold uppercase tracking-[0.22em] text-[var(--text3)]',
                        compact ? 'text-[9px]' : 'text-[11px]'
                    ]"
                >
                    {{ subtitle }}
                </p>
            </div>

            <!-- Status Pill matching ref.html -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(18,224,138,0.08)] border border-[rgba(18,224,138,0.22)] shadow-sm">
                <span class="pulse"></span>
                <span class="text-xs font-mono font-medium text-[var(--green)] tracking-wide">
                    {{ displayMessage }}
                </span>
                <span v-if="hasProgress" class="text-xs font-mono font-bold text-[var(--text)] ml-1">
                    {{ progress }}%
                </span>
            </div>

            <!-- High-Tech Progress Bar -->
            <div class="w-64 max-w-[80vw] h-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden relative shadow-inner">
                <!-- Determined Progress Fill -->
                <div
                    v-if="hasProgress"
                    class="h-full bg-gradient-to-r from-[var(--green2)] via-[var(--green)] to-[var(--cyan)] transition-all duration-300 rounded-full"
                    :style="{ width: `${progress}%` }"
                ></div>

                <!-- Indeterminate Laser Scanner Bar -->
                <div
                    v-else
                    class="indeterminate-laser absolute top-0 bottom-0 w-28 rounded-full bg-gradient-to-r from-transparent via-[var(--green)] to-transparent"
                ></div>
            </div>

            <!-- Monospace Telemetry Footnote -->
            <div
                v-if="showTelemetry && !compact"
                class="pt-3 flex items-center justify-center gap-2 text-[10px] font-mono text-[var(--text3)] uppercase tracking-wider"
            >
                <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[var(--green)] opacity-70"></span>
                    EDGE RUNTIME
                </span>
                <span class="opacity-40">•</span>
                <span>ZERO-TRUST</span>
                <span class="opacity-40">•</span>
                <span>DNS SYNC</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.indeterminate-laser {
    animation: laserScan 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    filter: drop-shadow(0 0 6px var(--green));
}

@keyframes laserScan {
    0% {
        transform: translateX(-120%);
    }
    50% {
        transform: translateX(180%);
    }
    100% {
        transform: translateX(300%);
    }
}
</style>

