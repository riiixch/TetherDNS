<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { fetchAccounts, deleteAccount } = useAccounts()
const toast = useToast()
const { t } = useI18n()

// State
const accounts = ref<any[]>([])
const pending = ref(true)
const searchQuery = ref('')
const isAddModalOpen = ref(false)

// Delete Confirm Modal State
const deleteModalOpen = ref(false)
const deletingAccount = ref<any>(null)
const deleteLoading = ref(false)

// Computed
const filteredAccounts = computed(() => {
    if (!searchQuery.value) return accounts.value
    const q = searchQuery.value.toLowerCase()
    return accounts.value.filter(a => 
        a.label.toLowerCase().includes(q) || 
        a.email.toLowerCase().includes(q)
    )
})

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
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {{ $t('accounts.title') }}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {{ $t('accounts.subtitle') }}
                    </p>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <UInput v-model="searchQuery" :placeholder="$t('common.search')" icon="i-heroicons-magnifying-glass"
                        size="sm" class="w-full sm:w-64"
                        :ui="{ root: 'rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500' }" />
                    
                    <UButton icon="i-heroicons-plus" color="primary" variant="solid"
                        class="rounded-xl font-bold shadow-sm w-full sm:w-auto justify-center px-4" size="sm"
                        @click="isAddModalOpen = true">
                        {{ $t('accounts.add_account') }}
                    </UButton>
                </div>
            </div>
        </template>

        <!-- Desktop Table View (lg and up) -->
        <div class="hidden lg:block overflow-x-auto">
            <UTable :data="filteredAccounts" :columns="columns" :loading="pending" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-4 border-b border-slate-200 dark:border-slate-800 lg:text-sm uppercase tracking-wider',
                td: 'py-4 lg:text-base text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #label-cell="{ row }">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">
                            {{ row.original.label.charAt(0).toUpperCase() }}
                        </div>
                        <span class="font-bold text-slate-900 dark:text-white">{{ row.original.label }}</span>
                    </div>
                </template>

                <template #email-cell="{ row }">
                    <span class="text-slate-500 dark:text-slate-400 font-medium">{{ row.original.email }}</span>
                </template>

                <template #zones-cell="{ row }">
                    <UBadge color="info" variant="subtle" size="sm" class="font-bold px-2.5">
                        {{ row.original?._count?.zones || 0 }} {{ $t('nav.zones') }}
                    </UBadge>
                </template>

                <template #createdAt-cell="{ row }">
                    <span class="text-sm font-medium text-slate-400">{{ formatDate(row.original.createdAt) }}</span>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-signal"
                            class="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                            @click="testConnection(row.original)">
                            {{ $t('common.test') }}
                        </UButton>
                        <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95"
                            @click="openDeleteModal(row.original)" />
                    </div>
                </template>
            </UTable>
        </div>

        <!-- Mobile/Tablet Card View (below lg) -->
        <div class="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            <template v-if="pending">
                <div v-for="i in 3" :key="i"
                    class="p-4 bg-white dark:bg-slate-900 rounded-2xl animate-pulse h-32 ring-1 ring-slate-200 dark:ring-slate-800">
                </div>
            </template>
            <template v-else-if="filteredAccounts.length === 0">
                <div class="py-12 text-center">
                    <UIcon name="i-heroicons-user-group" class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p class="text-base font-bold text-slate-900 dark:text-white">{{ $t('common.no_results') }}</p>
                </div>
            </template>
            <template v-else>
                <div v-for="account in filteredAccounts" :key="account.id"
                    class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 hover:ring-2 hover:ring-primary-500/20 transition-all">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                {{ account.label.charAt(0).toUpperCase() }}
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-900 dark:text-white leading-tight">{{ account.label }}
                                </h3>
                                <p class="text-xs text-slate-500 mt-1">{{ account.email }}</p>
                            </div>
                        </div>
                        <UBadge color="info" variant="subtle" size="xs" class="font-bold">
                            {{ account?._count?.zones || 0 }} {{ $t('nav.zones') }}
                        </UBadge>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            {{ formatDate(account.createdAt) }}
                        </span>
                        <div class="flex gap-2">
                            <UButton size="xs" color="neutral" variant="soft" icon="i-heroicons-signal"
                                class="rounded-lg" @click="testConnection(account)">
                                {{ $t('common.test') }}
                            </UButton>
                            <UButton size="xs" color="error" variant="soft" icon="i-heroicons-trash" class="rounded-lg"
                                @click="openDeleteModal(account)" />
                        </div>
                    </div>
                </div>
            </template>
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