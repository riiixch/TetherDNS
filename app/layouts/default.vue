<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from '#app'
import type { DropdownMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const { user, logout } = useAuth()
const route = useRoute()
const colorMode = useColorMode()

const isMobileMenuOpen = ref(false)
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

        <!-- Sticky Header / Nav matching ref.html -->
        <header class="nav" :class="{ 'menu-open': isMobileMenuOpen }">
            <div class="nav-in wrap">
                <!-- Brand logo & title -->
                <NuxtLink to="/" class="brand group focus:outline-none" @click="isMobileMenuOpen = false">
                    <div class="relative w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface2)] border border-[var(--border)] group-hover:border-[var(--green)] transition-all">
                        <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS" class="w-6 h-6 object-contain" />
                    </div>
                    <div class="brand-t">
                        <span>TetherDNS</span>
                        <small>{{ $t('nav.brand_subtitle') }}</small>
                    </div>
                </NuxtLink>

                <!-- System Operational status pill -->
                <span class="status-pill">
                    <span class="pulse"></span>
                    {{ $t('nav.system_status_ok') }}
                </span>

                <!-- Navigation Links (Inline on desktop, Dropdown below navbar on mobile) -->
                <nav v-if="user" class="nav-links" id="navLinks">
                    <NuxtLink
                        v-for="link in navLinks"
                        :key="link.path"
                        :to="link.path"
                        :class="{ on: isActive(link.path) }"
                        @click="isMobileMenuOpen = false"
                    >
                        {{ $t(link.name) }}
                    </NuxtLink>

                    <!-- Mobile-only logout link inside dropdown -->
                    <button
                        type="button"
                        class="nav-mobile-logout"
                        @click="logout"
                    >
                        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 text-[var(--danger)]" />
                        <span class="text-[var(--danger)] font-semibold">{{ $t('nav.logout') }} ({{ user.username }})</span>
                    </button>
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
                    <div v-if="user" class="desktop-avatar">
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

                    <!-- Mobile Menu Button (ONLY shown on <=1000px screens via .menu-btn CSS) -->
                    <button
                        type="button"
                        class="icon-btn menu-btn"
                        aria-label="Toggle Menu"
                        @click="isMobileMenuOpen = !isMobileMenuOpen"
                    >
                        <UIcon :name="isMobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-5 h-5 text-[var(--text)]" />
                    </button>
                </div>
            </div>
        </header>

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
