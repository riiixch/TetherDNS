<script setup lang="ts">
definePageMeta({
    layout: 'default',
})

const { user } = useAuth()
const { t } = useI18n()

const items = computed(() => [
    { label: t('dashboard.tab_zones'), icon: 'i-heroicons-globe-alt' },
    { label: t('dashboard.tab_accounts'), icon: 'i-heroicons-user-group' },
    { label: t('dashboard.tab_logs'), icon: 'i-heroicons-clock' }
])
</script>

<template>
    <div class="space-y-6 flex flex-col h-full">
        <div>
            <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>
            <p class="text-gray-400 mt-1">{{ $t('dashboard.subtitle') }}</p>
        </div>

        <!-- Dashboard Stats -->
        <ClientOnly>
            <DashboardStats />
        </ClientOnly>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-3">
                <ClientOnly>
                    <AnalyticsIpChangeChart />
                </ClientOnly>
            </div>
        </div>

        <UTabs :items="items" class="flex-1">
            <template #content="{ item }">
                <div v-if="item.icon === 'i-heroicons-globe-alt'" class="mt-4">
                    <ClientOnly>
                        <ZoneTable />
                    </ClientOnly>
                </div>
                <div v-else-if="item.icon === 'i-heroicons-user-group'" class="mt-4">
                    <ClientOnly>
                        <AccountTable />
                    </ClientOnly>
                </div>
                <div v-else-if="item.icon === 'i-heroicons-clock'" class="mt-4">
                    <ClientOnly>
                        <LogTable />
                    </ClientOnly>
                </div>
            </template>
        </UTabs>
    </div>
</template>
