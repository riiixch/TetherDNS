<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
    layout: 'auth',
})

const { setup } = useAuth()
const toast = useToast()
const { t } = useI18n()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const handleSetup = async () => {
    if (!username.value || !password.value) {
        toast.add({
            title: t('setup.failed'),
            description: t('setup.err_fields'),
            color: 'error'
        })
        return
    }

    if (password.value !== confirmPassword.value) {
        toast.add({
            title: t('setup.failed'),
            description: t('setup.err_match'),
            color: 'error'
        })
        return
    }

    isLoading.value = true
    try {
        await setup(username.value, password.value)

        toast.add({
            title: t('setup.success'),
            description: t('setup.created'),
            color: 'success'
        })

        navigateTo('/')
    } catch (e: any) {
        toast.add({
            title: t('setup.failed'),
            description: e.data?.statusMessage || e.message || t('setup.err_occurred'),
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <UCard class="w-full">
        <template #header>
            <h2 class="text-xl font-semibold text-center mt-2">{{ $t('setup.title') }}</h2>
            <p class="text-sm text-gray-400 text-center mt-1">{{ $t('setup.subtitle') }}</p>
        </template>

        <form @submit.prevent="handleSetup" class="space-y-4">
            <UFormField :label="$t('auth.username_field')" name="username">
                <UInput v-model="username" placeholder="admin" autofocus class="w-full" />
            </UFormField>

            <UFormField :label="$t('auth.password_field')" name="password">
                <UInput v-model="password" type="password" placeholder="••••••••" class="w-full" />
            </UFormField>

            <UFormField :label="$t('setup.confirm_password')" name="confirmPassword">
                <UInput v-model="confirmPassword" type="password" placeholder="••••••••" class="w-full" />
            </UFormField>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-4">
                {{ $t('setup.save_continue') }}
            </UButton>
        </form>
    </UCard>
</template>
