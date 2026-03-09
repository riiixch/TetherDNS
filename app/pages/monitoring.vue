<script setup lang="ts">
definePageMeta({
    layout: 'default'
})
</script>

<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold">{{ $t('monitoring.title') }}</h1>
            <p class="text-gray-400 mt-1">{{ $t('monitoring.subtitle') }}</p>
        </div>

        <UCard>
            <MonitoringTable />
        </UCard>
    </div>
</template>
