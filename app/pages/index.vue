<script setup lang="ts">
definePageMeta({
    layout: 'default',
})

const { user } = useAuth()

const items = [
    { label: 'DNS Zones', icon: 'i-heroicons-globe-alt' },
    { label: 'Accounts', icon: 'i-heroicons-user-group' },
    { label: 'Update Logs', icon: 'i-heroicons-clock' }
]
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
