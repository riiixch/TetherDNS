<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { fetchAccounts, deleteAccount } = useAccounts()
const toast = useToast()
const { t } = useI18n()

// State
const accounts = ref<any[]>([])
const pending = ref(true)
const isAddModalOpen = ref(false)

// Delete Confirm Modal State
const deleteModalOpen = ref(false)
const deletingAccount = ref<any>(null)
const deleteLoading = ref(false)

// Computed
const columns = computed(() => [
    { accessorKey: 'label', header: t('accounts.col_label') },
    { accessorKey: 'email', header: t('accounts.col_email') },
    { id: 'zones', header: t('accounts.col_zones') },
    { id: 'createdAt', header: t('accounts.col_created') },
    { id: 'actions', header: t('accounts.col_actions') }
])

// Actions
const loadData = async () => {
    pending.value = true
    try {
        accounts.value = await fetchAccounts()
    } catch (e: any) {
        toast.add({ title: t('accounts.load_error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const openDeleteModal = (account: any) => {
    deletingAccount.value = account
    deleteModalOpen.value = true
}

const executeDelete = async () => {
    if (!deletingAccount.value) return
    deleteLoading.value = true
    try {
        await deleteAccount(deletingAccount.value.id)
        toast.add({ title: t('common.success'), description: t('accounts.delete_success', { label: deletingAccount.value.label }), color: 'success' })
        loadData()
    } catch (e: any) {
        toast.add({ title: t('accounts.delete_failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    } finally {
        deleteLoading.value = false
        deleteModalOpen.value = false
        deletingAccount.value = null
    }
}

const testConnection = async (account: any) => {
    try {
        const res = await $fetch<{ message: string }>(`/api/accounts/${account.id}/test`, { method: 'POST' })
        toast.add({ title: t('accounts.conn_ok'), description: res.message, color: 'success' })
    } catch (e: any) {
        toast.add({ title: t('accounts.conn_failed'), description: e.data?.statusMessage || e.message, color: 'error' })
    }
}

const { locale } = useI18n()

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale.value === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => loadData())
</script>

<template>
    <UCard :ui="{ header: 'px-4 sm:px-6 py-5', body: 'p-0 sm:p-0' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex flex-col">
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{ $t('accounts.title')
                        }}</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{{ $t('accounts.subtitle')
                        }}</p>
                </div>

                <div class="flex w-full md:w-auto justify-end">
                    <UButton icon="i-heroicons-plus" color="primary" variant="solid"
                        class="rounded-xl font-bold shadow-sm w-full md:w-auto justify-center"
                        @click="isAddModalOpen = true">
                        {{ $t('accounts.add_account') }}
                    </UButton>
                </div>
            </div>
        </template>

        <div class="overflow-x-auto">
            <UTable :data="accounts" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800',
                td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #label-cell="{ row }">
                    <span class="font-semibold text-slate-900 dark:text-white">{{ row.original.label }}</span>
                </template>

                <template #email-cell="{ row }">
                    <span class="text-slate-500 dark:text-slate-400">{{ row.original.email }}</span>
                </template>

                <template #zones-cell="{ row }">
                    <UBadge color="info" variant="subtle" size="xs" class="font-bold">
                        {{ row.original?._count?.zones || 0 }}
                    </UBadge>
                </template>

                <template #createdAt-cell="{ row }">
                    <span class="text-xs font-medium text-slate-400">{{ formatDate(row.original.createdAt) }}</span>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-1.5">
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-signal"
                            class="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            @click="testConnection(row.original)">
                            {{ $t('common.test') }}
                        </UButton>
                        <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            @click="openDeleteModal(row.original)" />
                    </div>
                </template>
            </UTable>
        </div>

        <AccountAddModal v-if="isAddModalOpen" @close="isAddModalOpen = false" @refresh="loadData" />

        <UModal v-model:open="deleteModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('common.delete') }}
                                {{ $t('accounts.label_field') }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="deleteModalOpen = false" />
                        </div>
                    </template>

                    <div class="py-2 space-y-4">
                        <div
                            class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4">
                            <div class="flex gap-3">
                                <UIcon name="i-heroicons-exclamation-triangle"
                                    class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 class="text-sm font-bold text-red-800 dark:text-red-400">
                                        {{ $t('common.are_you_sure') }}
                                    </h4>
                                    <p class="text-xs text-red-600 dark:text-red-300 mt-2 leading-relaxed">
                                        {{ $t('common.delete') }} Account <strong
                                            class="text-red-900 dark:text-red-200">"{{
                                                deletingAccount?.label }}"</strong>?
                                    </p>
                                    <p class="text-[11px] text-red-500/80 dark:text-red-400/80 mt-1">
                                        {{ $t('accounts.delete_warning') }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton color="neutral" variant="ghost" class="rounded-xl"
                                @click="deleteModalOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton color="error" variant="solid" class="rounded-xl shadow-sm" :loading="deleteLoading"
                                @click="executeDelete">
                                {{ $t('common.delete') }}
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

    </UCard>
</template>