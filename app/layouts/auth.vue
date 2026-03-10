<template>
  <div
    class="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-primary-500/30">

    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-[100px] animate-pulse">
      </div>
      <div
        class="absolute bottom-1/4 right-1/4 w-120 h-120 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply">
      </div>
    </div>

    <div class="w-full max-w-104 p-6 mb-16 relative z-10">
      <div class="text-center mb-10 flex flex-col items-center">
        <div
          class="w-16 h-16 mb-6 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-primary-500/10 border border-slate-200 dark:border-slate-800 relative group">
          <div
            class="absolute inset-0 rounded-2xl border-2 border-primary-500/50 opacity-0 group-hover:opacity-100 transition-opacity scale-105 pointer-events-none">
          </div>
          <img src="/assets/images/tetherdns_logo.png" alt="TetherDNS Logo" class="w-full h-full object-contain" />
        </div>

        <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
          {{ $t('auth.title') }}
        </h1>
        <p class="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[16rem]">
          {{ $t('auth.subtitle') }}
        </p>
      </div>

      <slot />

      <div class="mt-8 text-center">
        <CommonLanguageSwitcher class="inline-flex" />
      </div>
    </div>
  </div>
</template>