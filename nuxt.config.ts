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
        langDir: 'locales/',
        compilation: {
            strictMessage: false,
        }
    },
    sourcemap: {
        server: false,
        client: false
    },
    vite: {
        build: {
            chunkSizeWarningLimit: 1000,
        },
        optimizeDeps: {
            include: [
                '@vue/devtools-core',
                '@vue/devtools-kit',
                'vue3-apexcharts',
            ],
            exclude: [
                '@prisma/client'
            ],
        }
    },
    nitro: {
        sourceMap: false,
        externals: {
            external: [
                '@prisma/client',
                '@prisma/adapter-libsql',
            ],
        },
    }
})