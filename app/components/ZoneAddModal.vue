<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    accounts: any[]
}>()
const emit = defineEmits(['close', 'refresh'])

const { addZone } = useZones()
const toast = useToast()

const isOpen = ref(true)
const domainName = ref('')
const selectedAccountId = ref<number | null>(props.accounts.length > 0 ? props.accounts[0].id : null)
const isLoading = ref(false)

const accountOptions = computed(() =>
    props.accounts.map((a: any) => ({ label: `${a.label} (${a.email})`, value: a.id }))
)

const handleAdd = async () => {
    if (!domainName.value) {
        toast.add({ title: 'Error', description: 'Domain name is required', color: 'error' })
        return
    }
    if (!selectedAccountId.value) {
        toast.add({ title: 'Error', description: 'Please select a Cloudflare account', color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await addZone(domainName.value, selectedAccountId.value)
        toast.add({ title: 'Success', description: `Zone ${domainName.value} added successfully.`, color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: 'Failed to add Zone',
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
    <UModal v-model:open="isOpen" title="Add New Zone" description="Add a new DNS zone to manage">
        <template #body>
            <form @submit.prevent="handleAdd" class="space-y-4">
                <UFormField label="Cloudflare Account" name="account">
                    <USelect v-model="selectedAccountId" :items="accountOptions" value-key="value"
                        placeholder="Select an account" class="w-full" />
                    <p class="text-xs text-gray-400 mt-1">Select the account that manages this domain in TetherDNS.</p>
                </UFormField>

                <UFormField label="Domain Name" name="domain">
                    <UInput v-model="domainName" placeholder="example.com" class="w-full" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the root domain name exactly as it
                        appears in TetherDNS.</p>
                </UFormField>

                <div class="flex justify-end gap-3 pt-2">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">Cancel</UButton>
                    <UButton type="submit" color="primary" :loading="isLoading">Add Zone</UButton>
                </div>
            </form>
        </template>
    </UModal>
</template>
