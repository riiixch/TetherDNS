<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { fetchAccounts, deleteAccount } = useAccounts()
const { startLoading, stopLoading } = useAppLoading()
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
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(locale.value === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

onMounted(async () => {
    startLoading(t('accounts.loading') || 'Loading Accounts...', t('accounts.subtitle') || 'Cloudflare API Integrations')
    await loadData()
    stopLoading(250)
})
</script>

<template>
    <div class="space-y-6">
        <!-- Page Head matching ref.html -->
        <section class="page-head">
            <div class="ph-left">
                <div class="ph-icon">
                    <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-[var(--green)]" />
                </div>
                <div>
                    <h1>{{ $t('accounts.title') }}</h1>
                    <p class="sub">{{ $t('accounts.subtitle') }}</p>
                </div>
            </div>
            <div class="ph-right">
                <button
                    type="button"
                    class="btn-ref ghost"
                    :disabled="pending"
                    @click="loadData"
                >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': pending }" />
                    <span>{{ $t('common.refresh') }}</span>
                </button>
                <button
                    type="button"
                    class="btn-ref primary"
                    @click="isAddModalOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('accounts.add_account') }}</span>
                </button>
            </div>
        </section>

        <!-- Search Bar -->
        <div class="card toolbar-card">
            <div class="toolbar">
                <div class="search">
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-[var(--text3)]" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        :placeholder="$t('common.search')"
                        autocomplete="off"
                    />
                </div>
                <div class="spacer"></div>
                <span class="chip green font-mono text-xs">
                    {{ filteredAccounts.length }} {{ $t('dashboard.stats_accounts') }}
                </span>
            </div>
        </div>

        <!-- Accounts Grid matching ref.html -->
        <div v-if="pending" class="py-16 text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--green)] mx-auto mb-2" />
            <p class="text-xs text-[var(--text3)]">Loading accounts...</p>
        </div>

        <div v-else class="acc-grid">
            <!-- Account Cards -->
            <div
                v-for="a in filteredAccounts"
                :key="a.id"
                class="card acc-card flex flex-col justify-between"
            >
                <div class="space-y-4">
                    <div class="acc-top">
                        <div class="avatar">
                            {{ (a.email || 'A').charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                            <div class="acc-email truncate" :title="a.email">{{ a.email }}</div>
                            <span class="chip">{{ a.label }}</span>
                        </div>
                        <span class="pill ok ml-auto">
                            <UIcon name="i-heroicons-check" class="w-3 h-3 text-[var(--green)]" />
                            VERIFIED
                        </span>
                    </div>

                    <div class="acc-token mono">
                        <UIcon name="i-heroicons-key" class="w-3.5 h-3.5 text-[var(--text3)] flex-none" />
                        <span class="truncate">cfut_••••••••••••{{ String(a.id).padStart(4, '0') }}</span>
                    </div>

                    <div class="acc-meta">
                        <span>{{ $t('accounts.col_zones') }}: <b>{{ a._count?.zones ?? a.zones?.length ?? 0 }}</b></span>
                        <span>Added {{ formatDate(a.createdAt) }}</span>
                    </div>
                </div>

                <div class="acc-foot pt-4 border-t border-[var(--border)] mt-4">
                    <button
                        type="button"
                        class="btn-ref ghost sm flex items-center gap-1.5"
                        @click="testConnection(a)"
                    >
                        <UIcon name="i-heroicons-shield-check" class="w-3.5 h-3.5 text-[var(--cyan)]" />
                        <span>Test API</span>
                    </button>
                    <button
                        type="button"
                        class="btn-ref danger-ghost sm flex items-center gap-1.5"
                        @click="openDeleteModal(a)"
                    >
                        <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                        <span>{{ $t('common.delete') }}</span>
                    </button>
                </div>
            </div>

            <!-- Add Tile matching ref.html -->
            <button
                type="button"
                class="add-tile"
                @click="isAddModalOpen = true"
            >
                <span class="icon-btn">
                    <UIcon name="i-heroicons-plus" class="w-5 h-5 text-[var(--green)]" />
                </span>
                <span>{{ $t('accounts.add_account') }}</span>
            </button>
        </div>

        <AccountAddModal
            v-if="isAddModalOpen"
            @close="isAddModalOpen = false"
            @refresh="loadData"
        />

        <!-- Delete Confirm Modal -->
        <UModal v-model:open="deleteModalOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--danger)] flex items-center gap-2">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                            <span>{{ $t('common.delete') }} Account</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="deleteModalOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <p class="text-xs text-[var(--text2)] leading-relaxed">
                        {{ $t('accounts.delete_confirm', { label: deletingAccount?.label }) }}
                    </p>

                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="btn-ref ghost" @click="deleteModalOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button
                            type="button"
                            class="btn-ref danger"
                            :disabled="deleteLoading"
                            @click="executeDelete"
                        >
                            {{ $t('common.delete') }}
                        </button>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>
