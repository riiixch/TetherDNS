<script setup lang="ts">
const toast = useToast()
const { t } = useI18n()
useHead({ title: t('accounts.title') })

definePageMeta({ layout: 'default' })
</script>

<template>
    <div class="space-y-6 lg:space-y-8 flex flex-col h-full pb-10">

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1
                    class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                        <UIcon name="i-heroicons-user-group-solid" class="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                    </div>
                    {{ $t('dashboard.tab_accounts') }}
                </h1>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {{ $t('accounts.subtitle') }}
                </p>
            </div>
        </div>

        <div class="w-full">
            <ClientOnly>
                <AccountTable />
            </ClientOnly>
        </div>

    </div>
</template>