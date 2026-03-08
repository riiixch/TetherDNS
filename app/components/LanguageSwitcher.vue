<script setup lang="ts">
const { locale, setLocale, locales } = useI18n()

const availableLocales = computed(() => {
    return locales.value.map((l: any) => ({
        label: l.name,
        value: l.code
    }))
})

const currentLocale = computed({
    get: () => locale.value,
    set: (val) => {
        setLocale(val)
    }
})
</script>

<template>
    <USelect v-model="currentLocale" :items="availableLocales" value-key="value" class="w-28" />
</template>
