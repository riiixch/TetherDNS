<script setup lang="ts">
const { isLoading, loadingTitle, loadingSubtitle, loadingMessage, loadingProgress } = useAppLoading()

useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} | TetherDNS` : 'TetherDNS - Cloudflare DDNS & Record Manager';
    },
    meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'description', content: 'Advanced Cloudflare DDNS & Record Manager' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f6f8fc' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#04070d' },
    ],
    link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap' },
    ],
    bodyAttrs: {
        class: 'min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans antialiased selection:bg-[rgba(18,224,138,0.25)] selection:text-[var(--text)] transition-colors duration-300'
    }
})
</script>

<template>
    <UApp>
        <!-- Sleek top edge progress indicator during route transitions -->
        <NuxtLoadingIndicator color="#12e08a" :height="3" :duration="2000" />

        <!-- High-tech global loading screen overlay for all pages -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-350 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0 pointer-events-none"
        >
            <CommonLoadingScreen
                v-if="isLoading"
                :fullscreen="true"
                :title="loadingTitle"
                :subtitle="loadingSubtitle"
                :message="loadingMessage"
                :progress="loadingProgress"
            />
        </Transition>

        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>