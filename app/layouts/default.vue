<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from '#app'

const { t } = useI18n()
const { user, logout } = useAuth()
const route = useRoute()
const colorMode = useColorMode()

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const avatarDropdownRef = ref<HTMLElement | null>(null)
const currentYear = new Date().getFullYear()

interface NavItem {
    name: string
    path: string
    icon: string
    desc: string
    colorClass: string
}

interface NavGroup {
    id: string
    name: string
    icon: string
    items: NavItem[]
}

const navGroups: NavGroup[] = [
    {
        id: 'services',
        name: 'nav.group_services',
        icon: 'i-heroicons-globe-alt',
        items: [
            {
                name: 'nav.zones',
                path: '/zones',
                icon: 'i-heroicons-globe-alt',
                desc: 'nav.desc_zones',
                colorClass: 'text-[var(--cyan)] bg-[rgba(6,182,212,0.1)] border-[rgba(6,182,212,0.2)]'
            },
            {
                name: 'nav.analytics',
                path: '/analytics',
                icon: 'i-heroicons-chart-bar',
                desc: 'nav.desc_analytics',
                colorClass: 'text-[var(--green)] bg-[rgba(18,224,138,0.1)] border-[rgba(18,224,138,0.2)]'
            },
            {
                name: 'nav.tunnels',
                path: '/tunnels',
                icon: 'i-heroicons-key',
                desc: 'nav.desc_tunnels',
                colorClass: 'text-purple-400 bg-[rgba(192,132,252,0.1)] border-[rgba(192,132,252,0.2)]'
            }
        ]
    },
    {
        id: 'monitoring',
        name: 'nav.group_monitoring',
        icon: 'i-heroicons-clipboard-document-list',
        items: [
            {
                name: 'nav.logs',
                path: '/logs',
                icon: 'i-heroicons-clock',
                desc: 'nav.desc_logs',
                colorClass: 'text-amber-400 bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.2)]'
            },
            {
                name: 'nav.audit',
                path: '/audit',
                icon: 'i-heroicons-clipboard-document-list',
                desc: 'nav.desc_audit',
                colorClass: 'text-blue-400 bg-[rgba(96,165,250,0.1)] border-[rgba(96,165,250,0.2)]'
            }
        ]
    },
    {
        id: 'system',
        name: 'nav.group_system',
        icon: 'i-heroicons-cog-6-tooth',
        items: [
            {
                name: 'nav.accounts',
                path: '/accounts',
                icon: 'i-heroicons-user-group',
                desc: 'nav.desc_accounts',
                colorClass: 'text-[var(--cyan)] bg-[rgba(6,182,212,0.1)] border-[rgba(6,182,212,0.2)]'
            },
            {
                name: 'nav.settings',
                path: '/settings',
                icon: 'i-heroicons-cog-6-tooth',
                desc: 'nav.desc_settings',
                colorClass: 'text-[var(--green)] bg-[rgba(18,224,138,0.1)] border-[rgba(18,224,138,0.2)]'
            }
        ]
    }
]

const openDropdownId = ref<string | null>(null)
const navDropdownRefs = ref<Record<string, HTMLElement | null>>({})

const isActive = (path: string) => {
    if (path === '/') return route.path === '/'
    return route.path === path || route.path.startsWith(path + '/')
}

const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => isActive(item.path))
}

const toggleDropdown = (id: string) => {
    openDropdownId.value = openDropdownId.value === id ? null : id
}

const closeAllDropdowns = () => {
    openDropdownId.value = null
}

const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = async () => {
    isUserMenuOpen.value = false
    closeAllDropdowns()
    await logout()
}

const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node
    if (avatarDropdownRef.value && !avatarDropdownRef.value.contains(target)) {
        isUserMenuOpen.value = false
    }
    if (openDropdownId.value) {
        const currentContainer = navDropdownRefs.value[openDropdownId.value]
        if (currentContainer && !currentContainer.contains(target)) {
            openDropdownId.value = null
        }
    }
}

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        isUserMenuOpen.value = false
        isMobileMenuOpen.value = false
        openDropdownId.value = null
    }
}

watch(() => route.path, () => {
    isMobileMenuOpen.value = false
    isUserMenuOpen.value = false
    openDropdownId.value = null
})

onMounted(() => {
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeydown)
})
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

                <!-- Navigation Links (Desktop: Compact 4 Items with Dropdowns, Mobile: Grouped Drawer) -->
                <nav v-if="user" class="nav-links" id="navLinks">
                    <!-- Mobile User Header -->
                    <div class="nav-mobile-user-card">
                        <div class="avatar-mini">
                            {{ user.username.charAt(0).toUpperCase() }}
                        </div>
                        <div class="avatar-user-info">
                            <span class="avatar-user-name">{{ user.username }}</span>
                            <span class="avatar-user-role">Administrator</span>
                        </div>
                    </div>

                    <!-- 1. แดชบอร์ด (Direct Link) -->
                    <NuxtLink
                        to="/"
                        class="nav-link-item"
                        :class="{ on: isActive('/') }"
                        @click="isMobileMenuOpen = false; closeAllDropdowns()"
                    >
                        <UIcon name="i-heroicons-squares-2x2" class="nav-link-ic w-4 h-4" />
                        <span>{{ $t('nav.dashboard') }}</span>
                    </NuxtLink>

                    <!-- DESKTOP DROPDOWNS (Hidden on Mobile) -->
                    <div
                        v-for="group in navGroups"
                        :key="group.id"
                        :ref="(el) => { if (el) navDropdownRefs[group.id] = el as HTMLElement }"
                        class="nav-dropdown-wrap desktop-only"
                    >
                        <button
                            type="button"
                            class="nav-dropdown-trigger"
                            :class="{ on: isGroupActive(group), open: openDropdownId === group.id }"
                            :aria-expanded="openDropdownId === group.id"
                            @click="toggleDropdown(group.id)"
                        >
                            <span>{{ $t(group.name) }}</span>
                            <UIcon
                                name="i-heroicons-chevron-down-20-solid"
                                class="w-3.5 h-3.5 opacity-70 transition-transform duration-200"
                                :class="{ 'rotate-180': openDropdownId === group.id }"
                            />
                        </button>

                        <Transition
                            enter-active-class="transition duration-150 ease-out"
                            enter-from-class="opacity-0 scale-95 -translate-y-1"
                            enter-to-class="opacity-100 scale-100 translate-y-0"
                            leave-active-class="transition duration-100 ease-in"
                            leave-from-class="opacity-100 scale-100 translate-y-0"
                            leave-to-class="opacity-0 scale-95 -translate-y-1"
                        >
                            <div
                                v-if="openDropdownId === group.id"
                                class="nav-dropdown-menu"
                                :class="{ 'align-right': group.id === 'system' }"
                            >
                                <NuxtLink
                                    v-for="item in group.items"
                                    :key="item.path"
                                    :to="item.path"
                                    class="nav-dropdown-item group/item"
                                    :class="{ on: isActive(item.path) }"
                                    @click="closeAllDropdowns"
                                >
                                    <div
                                        class="nav-dropdown-ic-box"
                                        :class="item.colorClass"
                                    >
                                        <UIcon :name="item.icon" class="w-4 h-4" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between">
                                            <span class="nav-dropdown-title">
                                                {{ $t(item.name) }}
                                            </span>
                                            <span v-if="isActive(item.path)" class="w-1.5 h-1.5 rounded-full bg-[var(--green)] shadow-[0_0_8px_var(--green)] shrink-0 ml-2"></span>
                                        </div>
                                        <span class="nav-dropdown-desc">
                                            {{ $t(item.desc) }}
                                        </span>
                                    </div>
                                </NuxtLink>
                            </div>
                        </Transition>
                    </div>

                    <!-- MOBILE GROUPED LIST (Hidden on Desktop) -->
                    <template v-for="group in navGroups" :key="'mob-group-' + group.id">
                        <div class="nav-mobile-section-title mobile-only">
                            {{ $t(group.name) }}
                        </div>
                        <NuxtLink
                            v-for="item in group.items"
                            :key="'mob-item-' + item.path"
                            :to="item.path"
                            class="nav-link-item mobile-only"
                            :class="{ on: isActive(item.path) }"
                            @click="isMobileMenuOpen = false"
                        >
                            <UIcon :name="item.icon" class="nav-link-ic w-4 h-4" />
                            <span>{{ $t(item.name) }}</span>
                        </NuxtLink>
                    </template>

                    <!-- Mobile-only logout link inside dropdown -->
                    <button
                        type="button"
                        class="nav-mobile-logout"
                        @click="handleLogout"
                    >
                        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 text-[var(--danger)]" />
                        <span class="text-[var(--danger)] font-semibold">{{ $t('nav.logout') }}</span>
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
                    <div v-if="user" ref="avatarDropdownRef" class="relative desktop-avatar">
                        <button
                            type="button"
                            class="avatar-btn"
                            :class="{ on: isUserMenuOpen }"
                            aria-label="User Profile"
                            @click="isUserMenuOpen = !isUserMenuOpen"
                        >
                            {{ user.username.charAt(0).toUpperCase() }}
                        </button>

                        <!-- Cybernetic Popover -->
                        <Transition
                            enter-active-class="transition duration-150 ease-out"
                            enter-from-class="opacity-0 scale-95 -translate-y-1"
                            enter-to-class="opacity-100 scale-100 translate-y-0"
                            leave-active-class="transition duration-100 ease-in"
                            leave-from-class="opacity-100 scale-100 translate-y-0"
                            leave-to-class="opacity-0 scale-95 -translate-y-1"
                        >
                            <div
                                v-if="isUserMenuOpen"
                                class="avatar-menu-popover"
                            >
                                <div class="avatar-menu-header">
                                    <div class="avatar-mini">
                                        {{ user.username.charAt(0).toUpperCase() }}
                                    </div>
                                    <div class="avatar-user-info">
                                        <span class="avatar-user-name">{{ user.username }}</span>
                                        <span class="avatar-user-role">Administrator</span>
                                    </div>
                                </div>

                                <div class="avatar-menu-divider"></div>

                                <div class="avatar-menu-list">
                                    <NuxtLink
                                        to="/settings"
                                        class="avatar-menu-item"
                                        @click="isUserMenuOpen = false"
                                    >
                                        <UIcon name="i-heroicons-cog-6-tooth" class="avatar-menu-ic text-[var(--cyan)]" />
                                        <span>{{ $t('nav.settings') }}</span>
                                    </NuxtLink>

                                    <button
                                        type="button"
                                        class="avatar-menu-item logout"
                                        @click="handleLogout"
                                    >
                                        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="avatar-menu-ic" />
                                        <span>{{ $t('nav.logout') }}</span>
                                    </button>
                                </div>
                            </div>
                        </Transition>
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

            <!-- Mobile Backdrop Scrim -->
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="isMobileMenuOpen"
                    class="nav-mobile-scrim"
                    aria-hidden="true"
                    @click="isMobileMenuOpen = false"
                ></div>
            </Transition>
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
                    <NuxtLink v-if="user" to="/analytics">{{ $t('nav.analytics') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/accounts">{{ $t('nav.accounts') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/tunnels">{{ $t('nav.tunnels') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/logs">{{ $t('nav.logs') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/audit">{{ $t('nav.audit') }}</NuxtLink>
                    <NuxtLink v-if="user" to="/settings">{{ $t('nav.settings') }}</NuxtLink>
                    <a href="https://github.com/riiixch/TetherDNS" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5">
                        <UIcon name="i-simple-icons-github" class="w-3.5 h-3.5 opacity-70 me-1.5" />
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
