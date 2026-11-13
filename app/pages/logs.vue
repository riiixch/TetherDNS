<script setup lang="ts">
const { t } = useI18n()
useHead({ title: t('logs.title') })

definePageMeta({ layout: 'default' })
</script>

<template>
    <div class="space-y-6 flex flex-col h-full pb-10">
        <ClientOnly>
            <LogTable />
        </ClientOnly>
    </div>
</template>
