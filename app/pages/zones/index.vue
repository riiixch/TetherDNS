<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-3 font-sans">
                <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 text-blue-500" />
                {{ $t('dashboard.tab_zones') }}
            </h1>
            <p class="text-slate-400 mt-1 font-medium font-sans">Manage your active Cloudflare zones and DNS records.
            </p>
        </div>

        <div
            class="bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl ring-1 ring-slate-800/50">
            <ClientOnly>
                <ZoneTable />
            </ClientOnly>
        </div>
    </div>
</template>
