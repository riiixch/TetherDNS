<script setup lang="ts">
const { user, logout } = useAuth()

const isOpenMenu = ref(false);
const currentYear = new Date().getFullYear();
</script>

<template>
    <div
        class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors">
        <!-- Navbar -->
        <header
            class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed w-full z-50 transition-all duration-300 mb-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Brand Zone -->
                    <div class="flex items-center gap-4">
                        <NuxtLink to="/" class="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
                            <div class="relative w-10 h-10 flex items-center justify-center">
                                <img src="/assets/images/tetherdns_logo.png" alt="TetherDNS"
                                    class="w-full h-full object-contain" />
                            </div>
                            <div class="flex flex-col">
                                <span
                                    class="font-bold text-lg tracking-tight leading-none text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">TetherDNS</span>
                                <span
                                    class="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                                    {{ $t('nav.brand_subtitle') }}
                                </span>
                            </div>
                        </NuxtLink>

                        <!-- Server Pulse Status -->
                        <div
                            class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span class="relative flex h-2 w-2">
                                <span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span class="text-[11px] font-semibold text-emerald-500 whitespace-nowrap">
                                {{ $t('nav.system_status_ok') }}
                            </span>
                        </div>
                    </div>

                    <!-- Navigation Zone (Desktop) -->
                    <nav
                        class="hidden lg:flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <NuxtLink v-if="user" to="/" class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                            :class="$route.path === '/' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'">
                            {{ $t('nav.dashboard') }}
                        </NuxtLink>
                        <NuxtLink v-if="user" to="/audit"
                            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                            :class="$route.path === '/audit' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'">
                            {{ $t('nav.audit') }}
                        </NuxtLink>
                        <NuxtLink v-if="user" to="/settings"
                            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                            :class="$route.path === '/settings' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'">
                            {{ $t('nav.settings') }}
                        </NuxtLink>
                    </nav>

                    <!-- Utilities Zone -->
                    <div class="flex items-center gap-2">
                        <div
                            class="hidden sm:flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-2 mr-2">
                            <LanguageSwitcher />
                            <ClientOnly>
                                <UButton
                                    :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                                    color="neutral" variant="ghost" aria-label="Theme" class="rounded-lg"
                                    @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" />
                                <template #fallback>
                                    <div class="w-8 h-8" />
                                </template>
                            </ClientOnly>
                        </div>

                        <div v-if="user" class="hidden sm:flex items-center gap-3">
                            <div class="flex flex-col items-end mr-1">
                                <span
                                    class="text-xs font-semibold text-slate-900 dark:text-white leading-none capitalize">{{
                                        user.username
                                    }}</span>
                                <span
                                    class="text-[10px] text-slate-500 dark:text-slate-500 mt-1 uppercase tracking-tighter">{{
                                        $t('common.you')
                                    }}</span>
                            </div>
                            <UButton color="error" variant="soft" icon="i-heroicons-arrow-right-on-rectangle" size="sm"
                                class="rounded-lg" @click="logout">
                                {{ $t('nav.logout') }}
                            </UButton>
                        </div>

                        <div class="lg:hidden">
                            <ClientOnly>
                                <USlideover title="TetherDNS" description="Navigation Menu" side="right"
                                    v-model:open="isOpenMenu">
                                    <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" size="lg" />

                                    <template #body>
                                        <div class="h-full flex flex-col gap-6 pt-4">
                                            <!-- Mobile User Info -->
                                            <div v-if="user"
                                                class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <div
                                                    class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold uppercase">
                                                    {{ user.username.charAt(0) }}
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="font-bold text-slate-900 dark:text-white capitalize">{{
                                                        user.username }}</span>
                                                    <span class="text-xs text-slate-500">{{ $t('common.you') }}</span>
                                                </div>
                                            </div>

                                            <!-- Mobile Links -->
                                            <div class="flex flex-col gap-2">
                                                <NuxtLink v-if="user" to="/" @click="isOpenMenu = false"
                                                    class="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium"
                                                    :class="$route.path === '/' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                                                    <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5" />
                                                    {{ $t('nav.dashboard') }}
                                                </NuxtLink>
                                                <NuxtLink v-if="user" to="/audit" @click="isOpenMenu = false"
                                                    class="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium"
                                                    :class="$route.path === '/audit' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                                                    <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5" />
                                                    {{ $t('nav.audit') }}
                                                </NuxtLink>
                                                <NuxtLink v-if="user" to="/settings" @click="isOpenMenu = false"
                                                    class="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium"
                                                    :class="$route.path === '/settings' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                                                    <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5" />
                                                    {{ $t('nav.settings') }}
                                                </NuxtLink>
                                            </div>

                                            <div class="mt-auto space-y-4">
                                                <div
                                                    class="flex items-center justify-between gap-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                    <LanguageSwitcher class="flex-1" />
                                                    <ClientOnly>
                                                        <UButton
                                                            :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                                                            color="neutral" variant="ghost"
                                                            @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" />
                                                    </ClientOnly>
                                                </div>
                                                <UButton v-if="user"
                                                    class="w-full h-12 flex justify-center text-base rounded-xl font-bold"
                                                    color="error" variant="soft"
                                                    icon="i-heroicons-arrow-right-on-rectangle" size="lg"
                                                    @click="logout">
                                                    {{ $t('nav.logout') }}
                                                </UButton>
                                            </div>
                                        </div>
                                    </template>
                                </USlideover>
                            </ClientOnly>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 my-16">
            <slot />
        </main>

        <!-- Footer -->
        <footer
            class="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <!-- Brand Section -->
                    <div class="col-span-1 md:col-span-2 space-y-4">
                        <div class="flex items-center gap-3">
                            <img src="/assets/images/tetherdns_logo.png" alt="TetherDNS" class="w-16 h-16 opacity-80" />
                            <span
                                class="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">TetherDNS</span>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            {{ $t('footer.brand_description') }}
                        </p>
                        <div class="flex items-center gap-2 text-xs font-medium">
                            <span class="text-slate-400 ">{{ $t('footer.developed_by') }}</span>
                            <NuxtLink to="https://github.com/riiixch" target="_blank"
                                class="text-primary-500 hover:text-primary-600 transition-colors font-bold">RIIIXCH
                            </NuxtLink>
                        </div>
                        <div class="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {{ $t('footer.copyright', { year: currentYear }) }}
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div class="space-y-4">
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{{
                            $t('common.all') }}</h4>
                        <ul class="space-y-2">
                            <li>
                                <NuxtLink to="/"
                                    class="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">
                                    {{ $t('footer.links.home') }}</NuxtLink>
                            </li>
                            <li v-if="user">
                                <NuxtLink to="/audit"
                                    class="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">
                                    {{ $t('footer.links.audit') }}</NuxtLink>
                            </li>
                            <li>
                                <NuxtLink to="https://github.com/riiixch/TetherDNS" target="_blank"
                                    class="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-1.5">
                                    <UIcon name="i-heroicons-code-bracket" class="w-4 h-4" />
                                    {{ $t('footer.links.repository') }}
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>

                    <!-- Powered By -->
                    <div class="space-y-4">
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {{ $t('footer.infrastructure') }}
                        </h4>
                        <div class="flex flex-col gap-3">
                            <div
                                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                                <UIcon name="i-heroicons-cloud" class="w-4 h-4 text-primary-500" />
                                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{
                                    $t('footer.powered_by') }}</span>
                            </div>
                            <div class="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {{ $t('footer.engine_status') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>
