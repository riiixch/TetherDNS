<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['close', 'refresh'])
const { addAccount } = useAccounts()
const toast = useToast()

const isOpen = ref(true)
const label = ref('')
const email = ref('')
const apiToken = ref('')
const isLoading = ref(false)

const handleAdd = async () => {
    if (!label.value || !email.value || !apiToken.value) {
        toast.add({ title: 'Error', description: 'All fields are required', color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await addAccount(label.value, email.value, apiToken.value)
        toast.add({ title: 'Success', description: `Account "${label.value}" added successfully.`, color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: 'Failed to add Account',
            description: e.data?.statusMessage || e.message || 'An error occurred',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

watch(isOpen, (val) => {
    if (!val) emit('close')
})
</script>

<template>
    <UModal v-model:open="isOpen" title="Add TetherDNS Account"
        description="Enter your Cloudflare API credentials below">
        <template #body>
            <form @submit.prevent="handleAdd" class="space-y-4">
                <UFormField label="Label" name="label">
                    <UInput v-model="label" placeholder="e.g. Main Account" class="w-full" autofocus />
                    <p class="text-xs text-gray-400 mt-1">A friendly name to identify this account.</p>
                </UFormField>

                <UFormField label="Account Email" name="email">
                    <UInput v-model="email" type="email" placeholder="admin@example.com" class="w-full" />
                </UFormField>

                <UFormField label="API Token" name="apiToken">
                    <UInput v-model="apiToken" type="password" placeholder="Your Cloudflare API Token" class="w-full" />
                    <p class="text-xs text-gray-400 mt-1">Token จะถูกเข้ารหัสก่อนเก็บลง Database</p>
                </UFormField>

                <div class="flex justify-end gap-3 pt-2">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading">Add Account</UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
