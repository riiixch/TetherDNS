<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
    layout: 'auth',
})

const { setup } = useAuth()
const toast = useToast()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const handleSetup = async () => {
    if (!username.value || !password.value) {
        toast.add({
            title: 'Setup Failed!',
            description: 'Please fill out all fields.',
            color: 'error'
        })
        return
    }

    if (password.value !== confirmPassword.value) {
        toast.add({
            title: 'Setup Failed!',
            description: 'Passwords do not match.',
            color: 'error'
        })
        return
    }

    isLoading.value = true
    try {
        await setup(username.value, password.value)

        toast.add({
            title: 'Setup Successful!',
            description: 'Your administrator account has been created.',
            color: 'success'
        })

        navigateTo('/')
    } catch (e: any) {
        toast.add({
            title: 'Setup Failed!',
            description: e.data?.statusMessage || e.message || 'An error occurred during setup.',
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
            <h2 class="text-xl font-semibold text-center mt-2">Initial Setup</h2>
            <p class="text-sm text-gray-400 text-center mt-1">Create your master administrator account to secure the
                DDNS
                manager.</p>
        </template>

        <form @submit.prevent="handleSetup" class="space-y-4">
            <UFormField label="Username" name="username">
                <UInput v-model="username" placeholder="admin" autofocus class="w-full" />
            </UFormField>

            <UFormField label="Password" name="password">
                <UInput v-model="password" type="password" placeholder="••••••••" class="w-full" />
            </UFormField>

            <UFormField label="Confirm Password" name="confirmPassword">
                <UInput v-model="confirmPassword" type="password" placeholder="••••••••" class="w-full" />
            </UFormField>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-4">
                Save & Continue
            </UButton>
        </form>
    </UCard>
</template>
