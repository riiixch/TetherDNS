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

const { locale } = useI18n()

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale.value === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => loadTokens())
</script>

<template>
    <UCard :ui="{ header: 'px-5 sm:px-6 py-5', body: 'p-0 sm:p-0' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                        <UIcon name="i-heroicons-key-solid" class="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{
                            $t('api_tokens.title') }}</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('api_tokens.subtitle') }}</p>
                    </div>
                </div>
                <UButton icon="i-heroicons-plus" color="primary"
                    class="rounded-xl font-bold px-4 shadow-sm w-full md:w-auto justify-center"
                    @click="isAddOpen = true">
                    {{ $t('api_tokens.generate_new') }}
                </UButton>
            </div>
        </template>

        <div class="overflow-x-auto">
            <UTable v-if="!loading && tokens.length > 0" :data="tokens" :columns="columns" :loading="loading" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800',
                td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #name-cell="{ row }">
                    <span class="font-semibold text-slate-900 dark:text-white">{{ row.original.name }}</span>
                </template>
                <template #createdAt-cell="{ row }">
                    <span class="text-slate-500 dark:text-slate-400 text-xs font-medium">{{
                        formatDate(row.original.createdAt) }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end">
                        <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            @click="deleteToken(row.original.id)" />
                    </div>
                </template>
            </UTable>

            <div v-if="!loading && tokens.length === 0"
                class="flex flex-col items-center justify-center p-10 text-center">
                <div
                    class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <UIcon name="i-heroicons-key" class="w-6 h-6 text-slate-400" />
                </div>
                <p class="text-sm font-medium text-slate-500">{{ $t('api_tokens.no_tokens') }}</p>
            </div>
        </div>

        <UModal v-model:open="isAddOpen" :prevent-close="!!newlyGeneratedToken" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('api_tokens.modal_title') }}</h3>
                            <UButton v-if="!newlyGeneratedToken" color="neutral" variant="ghost"
                                icon="i-heroicons-x-mark" class="-my-1" @click="closeAddModal" />
                        </div>
                    </template>

                    <div class="py-2">
                        <div v-if="newlyGeneratedToken" class="space-y-5">
                            <div
                                class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex gap-3">
                                <UIcon name="i-heroicons-exclamation-triangle"
                                    class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 class="text-sm font-bold text-amber-800 dark:text-amber-400">{{
                                        $t('api_tokens.important') }}
                                    </h4>
                                    <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">{{
                                        $t('api_tokens.important_desc') }}</p>
                                </div>
                            </div>

                            <div
                                class="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 break-all select-all font-mono text-slate-800 dark:text-slate-300 text-center shadow-inner">
                                {{ newlyGeneratedToken }}
                            </div>

                            <UButton block color="primary" variant="solid" class="rounded-xl font-bold h-10 shadow-sm"
                                @click="closeAddModal">
                                {{ $t('api_tokens.copied') }}
                            </UButton>
                        </div>

                        <form v-else @submit.prevent="generateToken" class="space-y-6">
                            <UFormField :label="$t('api_tokens.col_name')" name="name"
                                :hint="$t('api_tokens.name_hint')" help-class="text-slate-500 mt-1">
                                <UInput v-model="newTokenName" :placeholder="$t('api_tokens.name_placeholder')"
                                    class="w-full" :ui="{ root: 'rounded-xl' }" autofocus />
                            </UFormField>

                            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                                    @click="isAddOpen = false">
                                    {{ $t('common.cancel') }}
                                </UButton>
                                <UButton type="submit" color="primary" :loading="addLoading"
                                    class="rounded-xl font-bold px-6 shadow-sm" :disabled="!newTokenName">
                                    {{ $t('api_tokens.btn_generate') }}
                                </UButton>
                            </div>
                        </form>
                    </div>
                </UCard>
            </template>
        </UModal>
    </UCard>
</template>