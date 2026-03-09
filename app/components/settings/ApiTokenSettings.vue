<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const { t } = useI18n()
const toast = useToast()

const tokens = ref<any[]>([])
const loading = ref(true)

const isAddOpen = ref(false)
const addLoading = ref(false)
const newTokenName = ref('')
const newlyGeneratedToken = ref('')

const columns = computed(() => [
    { accessorKey: 'name', header: t('api_tokens.col_name') },
    { accessorKey: 'createdAt', header: t('api_tokens.col_created') },
    { id: 'actions', header: '' },
])

const loadTokens = async () => {
    loading.value = true
    try {
        const res = await $fetch<{ data: any[] }>('/api/users/tokens')
        tokens.value = res.data
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    } finally {
        loading.value = false
    }
}

const generateToken = async () => {
    addLoading.value = true
    try {
        const res = await $fetch<{ id: number, name: string, rawToken: string }>('/api/users/tokens', {
            method: 'POST',
            body: { name: newTokenName.value }
        })
        newlyGeneratedToken.value = res.rawToken
        toast.add({ title: t('common.success'), description: t('api_tokens.generate_success'), color: 'success' })
        loadTokens()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        addLoading.value = false
    }
}

const closeAddModal = () => {
    isAddOpen.value = false
    newlyGeneratedToken.value = ''
    newTokenName.value = ''
}

const deleteToken = async (id: number) => {
    try {
        await $fetch(`/api/users/tokens/${id}`, { method: 'DELETE' })
        toast.add({ title: t('common.success'), description: t('api_tokens.delete_success'), color: 'success' })
        loadTokens()
    } catch (e: any) {
        toast.add({ title: t('common.failed'), description: e.message, color: 'error' })
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
}

onMounted(() => loadTokens())
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold">{{ $t('api_tokens.title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('api_tokens.subtitle') }}</p>
                </div>
                <UButton icon="i-heroicons-plus" color="primary" @click="isAddOpen = true">
                    {{ $t('api_tokens.generate_new') }}
                </UButton>
            </div>
        </template>

        <UTable :data="tokens" :columns="columns" :loading="loading">
            <template #name-cell="{ row }">
                <span class="font-medium text-gray-200">{{ row.original.name }}</span>
            </template>
            <template #createdAt-cell="{ row }">
                <span class="text-gray-400 text-sm">{{ formatDate(row.original.createdAt) }}</span>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end">
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        @click="deleteToken(row.original.id)" />
                </div>
            </template>
        </UTable>

        <UModal v-model:open="isAddOpen" :title="$t('api_tokens.modal_title')" :prevent-close="!!newlyGeneratedToken">
            <template #body>
                <div v-if="newlyGeneratedToken" class="space-y-4">
                    <UAlert :title="$t('api_tokens.important')" :description="$t('api_tokens.important_desc')"
                        color="warning" variant="subtle" icon="i-heroicons-exclamation-triangle" />

                    <div
                        class="p-4 bg-gray-950 rounded border border-gray-800 break-all select-all font-mono text-primary-400 text-center text-lg">
                        {{ newlyGeneratedToken }}
                    </div>

                    <UButton block color="primary" @click="closeAddModal">{{ $t('api_tokens.copied') }}</UButton>
                </div>
                <form v-else @submit.prevent="generateToken" class="space-y-4">
                    <UFormField :label="$t('api_tokens.col_name')" name="name" :hint="$t('api_tokens.name_hint')">
                        <UInput v-model="newTokenName" :placeholder="$t('api_tokens.name_placeholder')" class="w-full"
                            autofocus />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isAddOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="addLoading" :disabled="!newTokenName">{{
                            $t('api_tokens.btn_generate') }}
                        </UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
