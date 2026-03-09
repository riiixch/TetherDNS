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
    <div class="space-y-8 flex flex-col h-full pb-10">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-3 font-sans">
                    <UIcon name="i-heroicons-squares-2x2-solid" class="w-8 h-8 text-primary-500" />
                    {{ $t('dashboard.title') }}
                </h1>
                <p class="text-slate-400 mt-1 font-medium font-sans">{{ $t('dashboard.subtitle') }}</p>
            </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Column: Primary Analytics & Activity -->
            <div class="col-span-12 lg:col-span-8 space-y-6">
                <!-- Chart Area -->
                <UCard
                    class="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 shadow-2xl relative overflow-hidden group min-h-[400px]">
                    <!-- <div
                        class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <UIcon name="i-heroicons-presentation-chart-line" class="w-32 h-32 text-primary-500" />
                    </div> -->
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4">
                            <h3
                                class="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 font-sans">
                                <div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                                {{ $t('analytics.ip_changes') }}
                            </h3>
                            <UBadge variant="subtle" color="primary" class="font-sans">24H Activity</UBadge>
                        </div>
                        <ClientOnly>
                            <AnalyticsIpChangeChart />
                        </ClientOnly>
                    </div>
                </UCard>
            </div>

            <!-- Right Column: Infrastructure Sidebar -->
            <div class="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
                <!-- System Pulse / Quick Info -->
                <UCard class="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
                    <div class="p-1">
                        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-2 font-sans">
                            {{ $t('dashboard.pulse_title') }}
                        </h3>
                        <div class="space-y-3">
                            <div
                                class="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 group hover:border-emerald-500/30 transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shadow-inner">
                                        <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p class="text-[13px] font-bold text-white font-sans">{{
                                            $t('dashboard.pulse_security') }}</p>
                                        <p class="text-[10px] text-slate-500 font-sans line-clamp-1">{{
                                            $t('dashboard.pulse_security_desc') }}</p>
                                    </div>
                                </div>
                                <UBadge color="success" variant="subtle" size="xs"
                                    class="font-sans font-black tracking-tighter">{{ $t('dashboard.pulse_secure') }}
                                </UBadge>
                            </div>

                            <div
                                class="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 group hover:border-blue-500/30 transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 rounded-lg bg-blue-500/10 text-blue-500 shadow-inner">
                                        <UIcon name="i-heroicons-cloud-arrow-up" class="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p class="text-[13px] font-bold text-white font-sans">{{
                                            $t('dashboard.pulse_sync') }}</p>
                                        <p class="text-[10px] text-slate-500 font-sans line-clamp-1">{{
                                            $t('dashboard.pulse_sync_desc') }}</p>
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-2 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                                    <span class="text-[10px] font-black text-blue-400 font-sans tracking-tight">{{
                                        $t('dashboard.pulse_live') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>

                <!-- Resource Promotion Card -->
                <UCard
                    class="bg-linear-to-br from-primary-600 to-blue-800 border-none relative overflow-hidden group shadow-2xl mt-auto">
                    <div
                        class="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
                        <UIcon name="i-heroicons-rocket-launch" class="w-40 h-40 text-white" />
                    </div>
                    <div class="relative z-10 p-2">
                        <h3 class="text-xl font-black text-white mb-2 font-sans">{{ $t('dashboard.scale_title') }}</h3>
                        <p class="text-xs text-primary-50/70 mb-6 leading-relaxed font-sans font-medium">
                            {{ $t('dashboard.scale_desc') }}
                        </p>
                        <div class="flex flex-col gap-2">
                            <UButton color="neutral" variant="solid" size="md" block
                                class="rounded-xl font-black text-primary-700 hover:bg-slate-100 transition-colors shadow-lg font-sans"
                                @click="$router.push('/settings')">
                                <UIcon name="i-heroicons-cog-6-tooth" class="w-4.5 h-4.5 mr-2" />
                                {{ $t('dashboard.btn_global_settings') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>
            </div>

            <div class="col-span-12">
                <ClientOnly>
                    <DashboardStats />
                </ClientOnly>
            </div>
        </div>

        <!-- Management Section (Full Width) -->
        <div class="pt-6 flex-1 space-y-6">
            <div class="flex items-center gap-4">
                <h2 class="text-2xl font-black text-white tracking-tight font-sans">{{ $t('dashboard.management_title')
                }}</h2>
                <div class="h-px flex-1 bg-linear-to-r from-slate-800 to-transparent"></div>
            </div>

            <UTabs :items="items" class="w-full" :ui="{
                list: 'relative flex-none rounded-2xl bg-slate-900/60 p-1 border border-slate-800/50 shadow-inner'
            }">
                <template #content="{ item }">
                    <div
                        class="mt-6 transform transition-all duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                        <UCard
                            class="bg-slate-900/30 backdrop-blur-md border-slate-800/40 overflow-hidden shadow-2xl rounded-2xl ring-1 ring-slate-800/50">
                            <div v-if="item.icon === 'i-heroicons-globe-alt'">
                                <ClientOnly>
                                    <ZoneTable />
                                </ClientOnly>
                            </div>
                            <div v-else-if="item.icon === 'i-heroicons-user-group'">
                                <ClientOnly>
                                    <AccountTable />
                                </ClientOnly>
                            </div>
                            <div v-else-if="item.icon === 'i-heroicons-clock'">
                                <ClientOnly>
                                    <LogTable />
                                </ClientOnly>
                            </div>
                        </UCard>
                    </div>
                </template>
            </UTabs>
        </div>
    </div>
</template>
