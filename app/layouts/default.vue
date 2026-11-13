<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from '#app'
import type { DropdownMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const { user, logout } = useAuth()
const route = useRoute()
const colorMode = useColorMode()

const isOpenMenu = ref(false)
const currentYear = new Date().getFullYear()

const navLinks = [
    { name: 'nav.dashboard', path: '/', icon: 'i-heroicons-squares-2x2' },
    { name: 'nav.zones', path: '/zones', icon: 'i-heroicons-globe-alt' },
    { name: 'nav.accounts', path: '/accounts', icon: 'i-heroicons-user-group' },
    { name: 'nav.tunnels', path: '/tunnels', icon: 'i-heroicons-key' },
    { name: 'nav.logs', path: '/logs', icon: 'i-heroicons-clock' },
    { name: 'nav.audit', path: '/audit', icon: 'i-heroicons-clipboard-document-list' },
    { name: 'nav.settings', path: '/settings', icon: 'i-heroicons-cog-6-tooth' },
]

const isActive = (path: string) => {
    if (path === '/') return route.path === '/'
    return route.path === path || route.path.startsWith(path + '/')
}

const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const userMenuItems = ref<DropdownMenuItem[][]>([
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
        color: 'error',
        onSelect: logout
    }]
])
</script>

<template>
    <div class="min-h-screen flex flex-col relative selection:bg-[rgba(18,224,138,0.25)] selection:text-[var(--text)]">
        <!-- Ambient animated backdrop matching ref.html -->
        <div class="ambient" aria-hidden="true">
            <div class="blobs">
                <div class="blob b1"></div>
                <div class="blob b2"></div>
                <div class="blob b3"></div>
            </div>
            <div class="grid-bg"></div>
            <div class="grain"></div>
        </div>

        <!-- Sticky Header / Nav -->
        <header class="nav">
            <div class="nav-in wrap">
                <!-- Brand logo & title -->
                <NuxtLink to="/" class="brand group focus:outline-none">
                    <div class="relative w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface2)] border border-[var(--border)] group-hover:border-[var(--green)] transition-all">
                        <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS" class="w-6 h-6 object-contain" />
                    </div>
                    <div class="brand-t">
                        <span>TetherDNS</span>
                        <small>{{ $t('nav.brand_subtitle') }}</small>
                    </div>
                </NuxtLink>

                <!-- System Operational status pill -->
                <span class="status-pill hidden md:inline-flex">
                    <span class="pulse"></span>
                    {{ $t('nav.system_status_ok') }}
                </span>

                <!-- Desktop Navigation Links -->
                <nav v-if="user" class="nav-links hidden xl:flex" id="navLinks">
                    <NuxtLink
                        v-for="link in navLinks"
                        :key="link.path"
                        :to="link.path"
                        :class="{ on: isActive(link.path) }"
                    >
                        {{ $t(link.name) }}
                    </NuxtLink>
                </nav>

                <!-- Header Actions Right -->
                <div class="nav-right">
                    <!-- Language switcher segmented pill -->
                    <CommonLanguageSwitcher />

                    <!-- Theme toggle button -->
                    <button
                        type="button"
                        class="icon-btn"
                        aria-label="Toggle Theme"
                        @click="toggleTheme"
                    >
                        <ClientOnly>
                            <UIcon
                                :name="colorMode.value === 'dark' ? 'i-heroicons-sun-20-solid' : 'i-heroicons-moon-20-solid'"
                                class="w-4 h-4 text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                            />
                            <template #fallback>
                                <span class="w-4 h-4"></span>
                            </template>
                        </ClientOnly>
                    </button>

                    <!-- User Profile Dropdown (Desktop) -->
                    <div v-if="user" class="hidden xl:block">
                        <UDropdownMenu :items="userMenuItems" placement="bottom-end">
                            <button
                                type="button"
                                class="avatar-btn"
                                aria-label="User Profile"
                            >
                                {{ user.username.charAt(0).toUpperCase() }}
                            </button>
                        </UDropdownMenu>
                    </div>

                    <!-- Mobile Menu Button -->
                    <button
                        type="button"
                        class="icon-btn xl:hidden"
                        aria-label="Open Menu"
                        @click="isOpenMenu = true"
                    >
                        <UIcon name="i-heroicons-bars-3" class="w-5 h-5 text-[var(--text)]" />
                    </button>
                </div>
            </div>
        </header>

        <!-- Mobile Drawer (Slideover) -->
        <ClientOnly>
            <USlideover
                v-model:open="isOpenMenu"
                side="right"
                :title="$t('nav.menu')"
            >
                <template #header>
                    <div class="flex items-center justify-between w-full p-4 border-b border-[var(--border)]">
                        <div class="flex items-center gap-2.5">
                            <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS Logo" class="w-7 h-7" />
                            <span class="font-bold text-lg font-['Space_Grotesk'] tracking-tight">TetherDNS</span>
                        </div>
                        <button type="button" class="icon-btn sm" @click="isOpenMenu = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>
                </template>

                <template #body>
                    <div class="flex flex-col gap-6 p-4">
                        <div v-if="user" class="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                            <div class="avatar-btn cursor-default">
                                {{ user.username.charAt(0).toUpperCase() }}
                            </div>
                            <div class="flex flex-col">
                                <span class="font-bold text-sm text-[var(--text)]">{{ user.username }}</span>
                                <span class="text-[10px] text-[var(--text3)] uppercase tracking-wider font-semibold">{{ $t('common.you') }}</span>
                            </div>
                        </div>

                        <div class="flex flex-col gap-1.5">
                            <NuxtLink
                                v-for="link in navLinks"
                                :key="link.path"
                                :to="link.path"
                                class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                :class="isActive(link.path)
                                    ? 'bg-[rgba(18,224,138,0.12)] text-[var(--green)] border border-[rgba(18,224,138,0.3)]'
                                    : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)] border border-transparent'"
                                @click="isOpenMenu = false"
                            >
                                <UIcon :name="link.icon" class="w-5 h-5 opacity-80" />
                                <span>{{ $t(link.name) }}</span>
                            </NuxtLink>
                        </div>
                    </div>
                </template>

                <template #footer>
                    <div class="p-4 border-t border-[var(--border)] space-y-3">
                        <UButton
                            v-if="user"
                            block
                            color="error"
                            variant="soft"
                            icon="i-heroicons-arrow-right-on-rectangle"
                            class="font-semibold rounded-xl"
                            @click="logout"
                        >
                            {{ $t('nav.logout') }}
                        </UButton>
                    </div>
                </template>
            </USlideover>
        </ClientOnly>

        <!-- Main Workspace -->
        <main class="wrap flex-1 relative z-10 w-full" id="app">
            <slot />
        </main>

        <!-- Footer matching ref.html -->
        <footer class="footer mt-auto" id="footer">
            <div class="wrap f-grid">
                <!-- Col 1: Brand & Bio -->
                <div class="f-brand">
                    <div class="f-brand-top">
                        <div class="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                            <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS Logo" class="w-6 h-6 object-contain" />
                        </div>
                        <span class="brand-t">TetherDNS</span>
                    </div>
                    <p>{{ $t('footer.brand_description') }}</p>
                    <span class="f-eng">
                        {{ $t('footer.developed_by') }}
                        <a href="https://github.com/riiixch" target="_blank" rel="noopener" class="text-[var(--green)] hover:underline ml-1">
                            RIIXCH
                        </a>
                    </span>
                </div>

                <!-- Col 2: Navigation Links -->
                <div class="f-links">
                    <div class="f-head">{{ $t('common.all') }}</div>
                    <NuxtLink to="/">{{ $t('nav.dashboard') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/zones">{{ $t('nav.zones') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/accounts">{{ $t('nav.accounts') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/tunnels">{{ $t('nav.tunnels') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/logs">{{ $t('nav.logs') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/audit">{{ $t('nav.audit') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/settings">{{ $t('nav.settings') }}</NuxtLink>
                    <a href="https://github.com/riiixch/TetherDNS" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5">
                        <UIcon name="i-simple-icons-github" class="w-3.5 h-3.5 opacity-70" />
                        <span>{{ $t('footer.links.repository') }}</span>
                    </a>
                </div>

                <!-- Col 3: Architecture Info -->
                <div class="f-arch">
                    <div class="f-head">{{ $t('footer.infrastructure') }}</div>
                    <div class="arch-card">
                        <div class="w-8 h-8 rounded-lg bg-[rgba(18,224,138,0.1)] text-[var(--green)] flex items-center justify-center flex-none">
                            <UIcon name="i-heroicons-server" class="w-4 h-4" />
                        </div>
                        <div>
                            <div class="arch-t">{{ $t('footer.powered_by') }}</div>
                            <span class="chip green">
                                <span class="dot ok"></span>
                                {{ $t('footer.engine_status') }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Copyright Bar -->
            <div class="wrap f-bottom">
                <span>© {{ currentYear }} TetherDNS. {{ $t('footer.copyright', { year: currentYear }) }}</span>
                <span class="f-design">
                    Design by <span class="text-[var(--green)] font-bold">RIIXCH</span>
                </span>
            </div>
        </footer>
    </div>
</template>
