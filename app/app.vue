<script setup lang="ts">
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
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>