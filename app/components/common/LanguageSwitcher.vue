<script setup lang="ts">
import { computed } from 'vue'

const { locale, setLocale, locales } = useI18n()

// หาชื่อของภาษาปัจจุบันเพื่อเอาไปแสดงบนปุ่ม
const currentLanguageName = computed(() => {
    const current = locales.value.find((l: any) => l.code === locale.value)
    return current ? current.name : 'Language'
})

// จัดรูปแบบ items สำหรับ UDropdown
const dropdownItems = computed(() => [
    locales.value.map((l: any) => ({
        label: l.name,
        // เพิ่มลูกเล่น: ถ้าเป็นภาษาที่กำลังเลือกอยู่ ให้โชว์ไอคอนติ๊กถูกสี Primary
        icon: locale.value === l.code ? 'i-heroicons-check-circle-solid' : 'i-heroicons-language',
        iconClass: locale.value === l.code ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500',
        onSelect: () => setLocale(l.code)
    }))
])
</script>

<template>
    <UDropdownMenu :items="dropdownItems" :ui="{
        content: 'w-36 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-lg',
        item: 'rounded-lg'
    }">
        <UButton color="neutral" variant="ghost" icon="i-heroicons-language"
            class="rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span class="hidden sm:inline">{{ currentLanguageName }}</span>
            <span class="sm:hidden">{{ locale.toUpperCase() }}</span> <template #trailing>
                <UIcon name="i-heroicons-chevron-down-20-solid"
                    class="w-4 h-4 text-slate-400 transition-transform ui-open:rotate-180" />
            </template>
        </UButton>
    </UDropdownMenu>
</template>