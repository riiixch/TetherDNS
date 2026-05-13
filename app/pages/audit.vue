<script setup lang="ts">
const { t } = useI18n()
useHead({ title: t('audit.title') })

definePageMeta({ layout: 'default' })
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1
                    class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                        <UIcon name="i-heroicons-clipboard-document-list-solid"
                            class="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
                    </div>
                    {{ $t('audit.title') }}
                </h1>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {{ $t('audit.subtitle') }}
                </p>
            </div>
        </div>

        <div class="w-full">
            <ClientOnly>
                <AuditTable />
            </ClientOnly>
        </div>

    </div>
</template>