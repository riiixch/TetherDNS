<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { fetchAccounts, deleteAccount } = useAccounts()
const toast = useToast()

const accounts = ref<any[]>([])
const pending = ref(true)
const isAddModalOpen = ref(false)

// Delete confirm modal
const deleteModalOpen = ref(false)
const deletingAccount = ref<any>(null)
const deleteLoading = ref(false)

import { computed } from 'vue'
const { t } = useI18n()

const columns = computed(() => [
    { accessorKey: 'label', header: t('accounts.col_label') },
    { accessorKey: 'email', header: t('accounts.col_email') },
    { id: 'zones', header: t('accounts.col_zones') },
    { id: 'createdAt', header: 'Created' },
    { id: 'actions', header: t('accounts.col_actions') }
])

const loadData = async () => {
    pending.value = true
    try {
        accounts.value = await fetchAccounts()
    } catch (e: any) {
        toast.add({ title: 'Error loading accounts', description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

onMounted(() => loadData())

const openDeleteModal = (account: any) => {
    deletingAccount.value = account
    deleteModalOpen.value = true
}

const executeDelete = async () => {
    if (!deletingAccount.value) return
    deleteLoading.value = true
    try {
        await deleteAccount(deletingAccount.value.id)
        toast.add({ title: 'Deleted', description: `Account "${deletingAccount.value.label}" removed successfully.`, color: 'success' })
        loadData()
    } catch (e: any) {
        toast.add({ title: 'Delete Failed', description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        deleteLoading.value = false
        deleteModalOpen.value = false
        deletingAccount.value = null
    }
}

const testConnection = async (account: any) => {
    try {
        const res = await $fetch<{ message: string }>(`/api/accounts/${account.id}/test`, { method: 'POST' })
        toast.add({ title: 'Connection OK ✅', description: res.message, color: 'success' })
    } catch (e: any) {
        toast.add({ title: 'Connection Failed ❌', description: e.data?.statusMessage || e.message, color: 'error' })
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex flex-wrap items-center justify-between">
                <div class="columns-12 lg:columns-6 flex flex-col">
                    <h2 class="text-lg font-semibold">{{ $t('accounts.title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('accounts.subtitle') }}</p>
                </div>
                <div class="columns-12 lg:columns-6 flex flex-wrap gap-2 lg:w-auto w-full justify-end">
                    <UButton icon="i-heroicons-plus" color="primary" @click="isAddModalOpen = true">
                        {{ $t('accounts.add_account') }}
                    </UButton>
                </div>
            </div>
        </template>

        <UTable :data="accounts" :columns="columns" :loading="pending">
            <template #zones-cell="{ row }">
                <UBadge color="secondary" variant="solid">{{ row.original?._count?.zones || 0 }}</UBadge>
            </template>
            <template #createdAt-cell="{ row }">
                <span class="text-sm text-gray-400">{{ formatDate(row.original.createdAt) }}</span>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end gap-1">
                    <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-signal"
                        @click="testConnection(row.original)">{{ $t('common.test') }}</UButton>
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        @click="openDeleteModal(row.original)" />
                </div>
            </template>
        </UTable>

        <AccountAddModal v-if="isAddModalOpen" @close="isAddModalOpen = false" @refresh="loadData" />

        <!-- Delete Confirm Modal -->
        <UModal v-model:open="deleteModalOpen" :title="$t('common.delete')" description="Confirm account deletion">
            <template #body>
                <div class="space-y-4">
                    <div class="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm">
                        <p class="font-semibold text-red-400 mb-2">{{ $t('common.are_you_sure') }}</p>
                        <p class="text-gray-300">
                            {{ $t('common.delete') }} Account <strong class="text-white">"{{ deletingAccount?.label
                            }}"</strong>?
                        </p>
                        <p class="text-gray-400 mt-1">Zone ที่ผูกกับ Account นี้ต้องถูกลบก่อน</p>
                    </div>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="ghost" @click="deleteModalOpen = false">{{ $t('common.cancel')
                        }}</UButton>
                        <UButton color="error" :loading="deleteLoading" @click="executeDelete">{{ $t('common.delete') }}
                        </UButton>
                    </div>
                </div>
            </template>
        </UModal>
    </UCard>
</template>
