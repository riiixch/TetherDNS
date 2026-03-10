<script setup lang="ts">
const { t } = useI18n()
useHead({ title: t('zones.title') })

definePageMeta({ layout: 'default' })
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1
                    class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                        <UIcon name="i-heroicons-globe-alt-solid" class="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                    </div>
                    {{ $t('dashboard.tab_zones') }}
                </h1>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {{ $t('zones.subtitle') }}
                </p>
            </div>
        </div>

        <div class="w-full">
            <ClientOnly>
                <ZoneTable />
            </ClientOnly>
        </div>

    </div>
</template>