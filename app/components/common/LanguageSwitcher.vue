<script setup lang="ts">
const { locale, setLocale } = useI18n()
</script>

<template>
    <div class="lang-seg" title="Switch Language / สลับภาษา">
        <UIcon name="i-heroicons-globe-alt" class="w-3.5 h-3.5 ml-1 text-[var(--text3)]" />
        <button type="button" :class="{ on: locale === 'th' }" @click="setLocale('th')">TH</button>
        <button type="button" :class="{ on: locale === 'en' }" @click="setLocale('en')">EN</button>
    </div>
</template>
