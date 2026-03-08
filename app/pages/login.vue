<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
    layout: 'auth',
})

const { login } = useAuth()
const toast = useToast()

const username = ref('')
const password = ref('')
const isLoading = ref(false)

const handleLogin = async () => {

    if (!username.value || !password.value) {
        toast.add({
            title: 'Login Failed!',
            description: 'Please fill out all fields.',
            color: 'error'
        })
        return
    }

    isLoading.value = true
    try {
        await login(username.value, password.value)
        // After successful login, redirect to dashboard
        navigateTo('/')
    } catch (e: any) {
        toast.add({
            title: 'Login Failed!',
            description: e.data?.statusMessage || e.message || 'Invalid username or password.',
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
            <h2 class="text-xl font-semibold text-center mt-2">{{ $t('auth.login_title') }}</h2>
            <p class="text-sm text-gray-400 text-center mt-1">{{ $t('auth.login_subtitle') }}</p>
        </template>

        <form @submit.prevent="handleLogin" class="space-y-4">
            <UFormField :label="$t('auth.username_field')" name="username">
                <UInput v-model="username" placeholder="admin" autofocus class="w-full" />
            </UFormField>

            <UFormField :label="$t('auth.password_field')" name="password">
                <UInput v-model="password" type="password" placeholder="••••••••" class="w-full" />
            </UFormField>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-4">
                {{ $t('auth.login_button') }}
            </UButton>
        </form>
    </UCard>
</template>
