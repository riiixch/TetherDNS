// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {
        enabled: true
    },
    css: ['~/assets/css/main.css'],
    modules: ['@nuxt/ui', '@nuxtjs/i18n'],
    i18n: {
        locales: [
            { code: 'en', file: 'en.json', name: 'English' },
            { code: 'th', file: 'th.json', name: 'ภาษาไทย' }
        ],
        defaultLocale: 'en',
        strategy: 'no_prefix',
        restructureDir: 'app',
        langDir: 'locales'
    }
})