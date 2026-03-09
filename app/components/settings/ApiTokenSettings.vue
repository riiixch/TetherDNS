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
    <UCard
        class="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xl rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800/50">
        <template #header>
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-key" class="w-5 h-5 text-primary-500" />
                    <div>
                        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">{{
                            $t('api_tokens.title') }}</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400 font-sans">{{ $t('api_tokens.subtitle') }}
                        </p>
                    </div>
                </div>
                <UButton icon="i-heroicons-plus" color="primary" class="rounded-xl font-bold font-sans px-4"
                    @click="isAddOpen = true">
                    {{ $t('api_tokens.generate_new') }}
                </UButton>
            </div>
        </template>

        <UTable :data="tokens" :columns="columns" :loading="loading" :ui="{
            th: 'bg-transparent text-slate-900 dark:text-slate-100 font-bold font-sans uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-800/50',
            td: 'py-4 font-sans'
        }">
            <template #name-cell="{ row }">
                <span class="font-bold text-slate-900 dark:text-slate-200">{{ row.original.name }}</span>
            </template>
            <template #createdAt-cell="{ row }">
                <span class="text-slate-500 dark:text-slate-400 text-sm italic">{{ formatDate(row.original.createdAt)
                    }}</span>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end">
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        class="rounded-lg hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                        @click="deleteToken(row.original.id)" />
                </div>
            </template>
        </UTable>

        <UModal v-model:open="isAddOpen" :title="$t('api_tokens.modal_title')" :prevent-close="!!newlyGeneratedToken"
            :ui="{
                content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
                header: 'font-black tracking-tight text-xl font-sans'
            }">
            <template #body>
                <div v-if="newlyGeneratedToken" class="space-y-6">
                    <UAlert :title="$t('api_tokens.important')" :description="$t('api_tokens.important_desc')"
                        color="warning" variant="subtle" icon="i-heroicons-exclamation-triangle"
                        class="rounded-2xl border-warning-200/50" />

                    <div
                        class="p-6 bg-slate-950 dark:bg-slate-950/80 rounded-2xl border border-slate-800 break-all select-all font-mono text-primary-400 text-center text-xl shadow-inner shadow-black">
                        {{ newlyGeneratedToken }}
                    </div>

                    <UButton block color="primary" class="rounded-xl font-bold h-12" @click="closeAddModal">{{
                        $t('api_tokens.copied') }}</UButton>
                </div>
                <form v-else @submit.prevent="generateToken" class="space-y-6">
                    <UFormField :label="$t('api_tokens.col_name')" name="name" :hint="$t('api_tokens.name_hint')"
                        help-class="text-slate-500 font-sans">
                        <UInput v-model="newTokenName" :placeholder="$t('api_tokens.name_placeholder')" class="w-full"
                            :ui="{ base: 'rounded-xl h-12 font-sans' }" autofocus />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                            @click="isAddOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="addLoading" class="rounded-xl font-bold px-8"
                            :disabled="!newTokenName">{{
                                $t('api_tokens.btn_generate') }}
                        </UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
