<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from '#app'
import type { DropdownMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const { user, logout } = useAuth()
const route = useRoute()

const isOpenMenu = ref(false)
const currentYear = new Date().getFullYear()

// รวมลิสต์เมนูไว้ที่เดียว เพื่อง่ายต่อการจัดการและลูปใช้งาน
const navLinks = [
    { name: 'nav.dashboard', path: '/', icon: 'i-heroicons-squares-2x2' },
    { name: 'nav.zones', path: '/zones', icon: 'i-heroicons-globe-alt' },
    { name: 'nav.accounts', path: '/accounts', icon: 'i-heroicons-user-group' },
    { name: 'nav.logs', path: '/logs', icon: 'i-heroicons-clock' },
    { name: 'nav.audit', path: '/audit', icon: 'i-heroicons-clipboard-document-list' },
    { name: 'nav.settings', path: '/settings', icon: 'i-heroicons-cog-6-tooth' },
]

// เช็ค Active State ของ Menu
const isActive = (path: string) => route.path === path

// ตั้งค่า Dropdown สำหรับ User Profile (Desktop)
const userMenuItems = ref<DropdownMenuItem[]>([
    [{
        label: user.value?.username.toUpperCase() || t('nav.user_profile'),
        slot: 'account',
        disabled: true
    }],
    [{
        label: t('nav.settings'),
        icon: 'i-heroicons-cog-8-tooth',
        to: '/settings'
    }],
    [{
        label: t('nav.logout'),
        icon: 'i-heroicons-arrow-right-on-rectangle',
        color: "error",
        onSelect: logout
    }]
])
</script>

<template>
    <div
        class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-primary-500/30">

        <header
            class="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm dark:shadow-none transition-all duration-300">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">

                    <div class="flex items-center gap-5">
                        <NuxtLink to="/"
                            class="flex items-center gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
                            <div
                                class="relative w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-105 group-hover:shadow-md">
                                <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS"
                                    class="w-8 h-8 object-contain" />
                            </div>
                            <div class="flex flex-col justify-center">
                                <span
                                    class="font-bold text-lg tracking-tight leading-none text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">TetherDNS</span>
                                <span
                                    class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                    {{ $t('nav.brand_subtitle') }}
                                </span>
                            </div>
                        </NuxtLink>

                        <div
                            class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                            <span class="relative flex h-2 w-2">
                                <span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span
                                class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider whitespace-nowrap">
                                {{ $t('nav.system_status_ok') }}
                            </span>
                        </div>
                    </div>

                    <nav v-if="user"
                        class="hidden xl:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <NuxtLink v-for="link in navLinks" :key="link.path" :to="link.path"
                            class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            :class="isActive(link.path)
                                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'">
                            {{ $t(link.name) }}
                        </NuxtLink>
                    </nav>

                    <div class="flex items-center gap-1.5 sm:gap-3">
                        <div
                            class="hidden sm:flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3 mr-1">
                            <CommonLanguageSwitcher />
                            <ClientOnly>
                                <UButton
                                    :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                                    color="neutral" variant="ghost" aria-label="Toggle Theme"
                                    class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" />
                                <template #fallback>
                                    <div class="w-8 h-8" />
                                </template>
                            </ClientOnly>
                        </div>

                        <div v-if="user" class="hidden xl:block">
                            <UDropdownMenu :items="userMenuItems" placement="bottom-end">
                                <UButton color="neutral" variant="ghost"
                                    class="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div
                                        class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold uppercase text-sm">
                                        {{ user.username.charAt(0) }}
                                    </div>
                                </UButton>
                            </UDropdownMenu>
                        </div>

                        <div class="xl:hidden">
                            <ClientOnly>
                                <USlideover :title="$t('nav.menu')" :description="$t('nav.navigation_menu')"
                                    side="right" v-model:open="isOpenMenu">
                                    <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost"
                                        class="rounded-lg" />

                                    <template #header>
                                        <div class="flex flex-col w-full bg-white dark:bg-slate-900">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <img src="~/assets/images/tetherdns_logo.png" alt="Logo"
                                                        class="w-10 h-10" />
                                                    <span class="text-xl font-bold text-slate-900 dark:text-white">{{
                                                        $t('nav.menu') }}</span>
                                                </div>
                                                <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost"
                                                    @click="isOpenMenu = false" />
                                            </div>
                                        </div>
                                    </template>

                                    <template #body>
                                        <div class="flex flex-col h-full bg-white dark:bg-slate-900">
                                            <div class="flex-1 overflow-y-auto flex flex-col gap-6">
                                                <div v-if="user"
                                                    class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                                    <div
                                                        class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold uppercase text-lg">
                                                        {{ user.username.charAt(0) }}
                                                    </div>
                                                    <div class="flex flex-col">
                                                        <span
                                                            class="font-bold text-sm text-slate-900 dark:text-white capitalize">{{
                                                                user.username
                                                            }}</span>
                                                        <span
                                                            class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{{
                                                                $t('common.you') }}</span>
                                                    </div>
                                                </div>

                                                <div class="flex flex-col gap-1">
                                                    <NuxtLink v-for="link in navLinks" :key="link.path" :to="link.path"
                                                        @click="isOpenMenu = false"
                                                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm"
                                                        :class="isActive(link.path) ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                                                        <UIcon :name="link.icon" class="w-5 h-5" />
                                                        {{ $t(link.name) }}
                                                    </NuxtLink>
                                                </div>
                                            </div>
                                        </div>
                                    </template>

                                    <template #footer>
                                        <div class="flex flex-col w-full bg-white dark:bg-slate-900">
                                            <div class="space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                                                <div
                                                    class="flex items-center justify-between p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <CommonLanguageSwitcher class="flex-1 px-2" />
                                                    <div class="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                                    <UButton
                                                        :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                                                        color="neutral" variant="ghost" class="rounded-md"
                                                        @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" />
                                                </div>
                                                <UButton v-if="user" block color="error" variant="soft"
                                                    icon="i-heroicons-arrow-right-on-rectangle" class="font-semibold"
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

        <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col">
            <slot />
        </main>

        <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-12">

                    <div class="md:col-span-5 space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS"
                                    class="w-8 h-8 opacity-80" />
                            </div>
                            <span
                                class="font-bold text-xl tracking-tight text-slate-900 dark:text-white">TetherDNS</span>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                            {{ $t('footer.brand_description') }}
                        </p>
                        <div class="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>{{ $t('footer.developed_by') }}</span>
                            <NuxtLink to="https://github.com/riiixch" target="_blank"
                                class="font-bold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                RIIIXCH
                            </NuxtLink>
                        </div>
                    </div>

                    <div class="md:col-span-3 space-y-4 md:pl-8">
                        <h4 class="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">{{
                            $t('common.all') }}</h4>
                        <ul class="space-y-2.5">
                            <li>
                                <NuxtLink to="/"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block">
                                    {{ $t('footer.links.dashboard') }}
                                </NuxtLink>
                            </li>
                            <li v-if="user">
                                <NuxtLink to="/zones"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block">
                                    {{ $t('footer.links.zones') }}
                                </NuxtLink>
                            </li>
                            <li v-if="user">
                                <NuxtLink to="/accounts"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block">
                                    {{ $t('footer.links.accounts') }}
                                </NuxtLink>
                            </li>
                            <li v-if="user">
                                <NuxtLink to="/logs"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block">
                                    {{ $t('footer.links.logs') }}
                                </NuxtLink>
                            </li>
                            <li v-if="user">
                                <NuxtLink to="/audit"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block">
                                    {{ $t('footer.links.audit') }}
                                </NuxtLink>
                            </li>
                            <li v-if="user">
                                <NuxtLink to="/settings"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-block">
                                    {{ $t('footer.links.settings') }}
                                </NuxtLink>
                            </li>
                            <li>
                                <NuxtLink to="https://github.com/riiixch/TetherDNS" target="_blank"
                                    class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1.5 group">
                                    <UIcon name="i-simple-icons-github"
                                        class="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                    {{ $t('footer.links.repository') }}
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>

                    <div class="md:col-span-4 space-y-4">
                        <h4 class="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">{{
                            $t('footer.infrastructure') }}</h4>
                        <div
                            class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                            <div class="flex items-center gap-3 mb-3">
                                <div
                                    class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <UIcon name="i-heroicons-server" class="w-4 h-4" />
                                </div>
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">{{
                                    $t('footer.powered_by')
                                    }}</span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                <span
                                    class="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex items-center justify-center">
                                    <span
                                        class="absolute w-full h-full bg-emerald-500 rounded-full animate-ping opacity-60"></span>
                                </span>
                                {{ $t('footer.engine_status') }}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="text-xs font-medium text-slate-400 dark:text-slate-50">
                        {{ $t('footer.copyright', { year: currentYear }) }}
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>