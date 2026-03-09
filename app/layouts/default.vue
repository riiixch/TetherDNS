<script setup lang="ts">
const { user, logout } = useAuth()

const isOpenMenu = ref(false);
</script>

<template>
    <div
        class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors">
        <!-- Navbar -->
        <header class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed w-full z-50">
            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] py-2 flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-2">
                    <img src="/assets/images/tetherdns_logo.png" alt="TetherDNS" class="w-10 h-10" />
                    <span class="font-bold text-lg">TetherDNS</span>
                </div>

                <div class="hidden lg:flex items-center gap-2 sm:gap-4 flex-wrap">
                    <NuxtLink v-if="user" to="/"
                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        {{ $t('nav.dashboard') }}
                    </NuxtLink>
                    <NuxtLink v-if="user" to="/audit"
                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        {{ $t('nav.audit') }}
                    </NuxtLink>
                    <NuxtLink v-if="user" to="/monitoring"
                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        {{ $t('nav.monitoring') }}
                    </NuxtLink>
                    <NuxtLink v-if="user" to="/settings"
                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        {{ $t('nav.settings') }}</NuxtLink>
                    <span v-if="user" class="text-sm text-gray-500 dark:text-gray-400 hidden md:inline">
                        {{ $t('common.you') }}, <strong class="text-gray-900 dark:text-gray-100">
                            {{ user.username }}
                        </strong>
                    </span>
                    <LanguageSwitcher />
                    <ClientOnly>
                        <UButton :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                            color="neutral" variant="ghost" aria-label="Theme"
                            @click="$colorMode.value = $colorMode.value === 'dark' ? 'light' : 'dark'" />
                        <template #fallback>
                            <div class="w-8 h-8" />
                        </template>
                    </ClientOnly>
                    <UButton v-if="user" color="error" variant="ghost" icon="i-heroicons-arrow-right-on-rectangle"
                        size="sm" @click="logout">
                        {{ $t('nav.logout') }}
                    </UButton>
                </div>

                <div class="lg:hidden flex items-center gap-2 flex-wrap">
                    <ClientOnly>
                        <UButton :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                            color="neutral" variant="ghost" aria-label="Theme"
                            @click="$colorMode.value = $colorMode.value === 'dark' ? 'light' : 'dark'" />
                        <template #fallback>
                            <div class="w-8 h-8" />
                        </template>
                    </ClientOnly>
                    <ClientOnly>
                        <USlideover title="TetherDNS" description="Navigation Menu" side="right"
                            v-model:open="isOpenMenu">
                            <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" />

                            <template #body>
                                <div class="h-full flex flex-col gap-3">
                                    <span v-if="user" class="text-sm text-gray-500 dark:text-gray-400">
                                        {{ $t('common.you') }}, <strong class="text-gray-900 dark:text-gray-100">
                                            {{ user.username }}
                                        </strong>
                                    </span>
                                    <NuxtLink v-if="user" to="/" @click="isOpenMenu = false"
                                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                        {{ $t('nav.dashboard') }}
                                    </NuxtLink>
                                    <NuxtLink v-if="user" to="/audit" @click="isOpenMenu = false"
                                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                        {{ $t('nav.audit') }}
                                    </NuxtLink>
                                    <NuxtLink v-if="user" to="/monitoring" @click="isOpenMenu = false"
                                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                        {{ $t('nav.monitoring') }}
                                    </NuxtLink>
                                    <NuxtLink v-if="user" to="/settings" @click="isOpenMenu = false"
                                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                        {{ $t('nav.settings') }}
                                    </NuxtLink>
                                    <LanguageSwitcher class="w-full" />
                                    <UButton v-if="user" class="flex justify-center" color="error" variant="outline"
                                        icon="i-heroicons-arrow-right-on-rectangle" size="md" @click="logout">
                                        {{ $t('nav.logout') }}
                                    </UButton>
                                </div>
                            </template>
                        </USlideover>
                    </ClientOnly>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
            <slot />
        </main>
    </div>
</template>
