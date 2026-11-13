<script setup lang="ts">
const colorMode = useColorMode()

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen relative flex items-center justify-center p-4 selection:bg-[rgba(18,224,138,0.25)] selection:text-[var(--text)] overflow-hidden font-sans">
    <!-- Ambient glowing backdrop matching ref.html -->
    <div class="ambient" aria-hidden="true">
      <div class="blobs">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="blob b3"></div>
      </div>
      <div class="grid-bg"></div>
      <div class="grain"></div>
    </div>

    <!-- Top floating controls -->
    <div class="absolute top-6 right-6 z-20 flex items-center gap-2">
      <CommonLanguageSwitcher />
      <button
        type="button"
        class="icon-btn"
        aria-label="Toggle Theme"
        @click="toggleTheme"
      >
        <ClientOnly>
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-heroicons-sun-20-solid' : 'i-heroicons-moon-20-solid'"
            class="w-4 h-4 text-[var(--text2)]"
          />
          <template #fallback>
            <span class="w-4 h-4"></span>
          </template>
        </ClientOnly>
      </button>
    </div>

    <div class="w-full max-w-[420px] relative z-10 py-10">
      <div class="text-center mb-8 flex flex-col items-center">
        <div class="w-14 h-14 mb-4 p-2 bg-[var(--surface2)] rounded-2xl shadow-xl border border-[var(--border)] relative group transition-transform hover:scale-105">
          <img src="~/assets/images/tetherdns_logo.png" alt="TetherDNS Logo" class="w-full h-full object-contain" />
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] tracking-tight text-[var(--text)] leading-none">
          {{ $t('auth.title') }}
        </h1>
        <p class="mt-2 text-xs sm:text-sm font-medium text-[var(--text3)]">
          {{ $t('auth.subtitle') }}
        </p>
      </div>

      <slot />
    </div>
  </div>
</template>
