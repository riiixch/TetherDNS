<script setup lang="ts">
useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} | TetherDNS` : 'TetherDNS';
    },
    meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'description', content: 'Advanced Cloudflare DDNS & Record Manager' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f8fafc' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#020617' },
    ],
    link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
    bodyAttrs: {
        class: 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500/30 selection:text-primary-900 dark:selection:text-primary-100 transition-colors duration-300'
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