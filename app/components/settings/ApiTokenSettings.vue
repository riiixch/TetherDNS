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

const loadTokens = async () => {
    loading.value = true
    try {
        const res = await $fetch<{ data: any[] }>('/api/users/tokens')
        tokens.value = res.data || []
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
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(locale.value === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => loadTokens())
</script>

<template>
    <div class="space-y-6">
        <div class="card set-card overflow-hidden">
            <div class="card-head flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div class="card-title">
                    <UIcon name="i-heroicons-key" class="w-4 h-4 text-[var(--violet)]" />
                    <span>{{ $t('api_tokens.title') }}</span>
                </div>
                <button
                    type="button"
                    class="btn-ref primary sm"
                    @click="isAddOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('api_tokens.generate_new') }}</span>
                </button>
            </div>

            <!-- Token Table -->
            <div class="overflow-x-auto w-full">
                <table v-if="!loading && tokens.length > 0" class="rtable-ref">
                    <thead>
                        <tr>
                            <th class="w-1/2 min-w-[180px]">{{ $t('api_tokens.col_name') }}</th>
                            <th class="w-2/5 min-w-[140px]">{{ $t('api_tokens.col_created') }}</th>
                            <th class="w-20 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="tok in tokens" :key="tok.id">
                            <td>
                                <span class="font-bold text-[var(--text)]">{{ tok.name }}</span>
                            </td>
                            <td>
                                <span class="text-xs text-[var(--text2)] font-mono">{{ formatDate(tok.createdAt) }}</span>
                            </td>
                            <td class="text-right">
                                <button
                                    type="button"
                                    class="icon-btn sm text-[var(--danger)] hover:bg-[rgba(251,94,122,0.15)] inline-flex items-center justify-center"
                                    @click="deleteToken(tok.id)"
                                >
                                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="!loading && tokens.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-3">
                        <UIcon name="i-heroicons-key" class="w-6 h-6 text-[var(--text3)]" />
                    </div>
                    <p class="text-xs text-[var(--text2)]">{{ $t('api_tokens.no_tokens') }}</p>
                </div>

                <div v-if="loading" class="flex items-center justify-center py-12">
                    <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--green)]" />
                </div>
            </div>
        </div>

        <!-- Create Token Modal -->
        <UModal v-model:open="isAddOpen" :prevent-close="!!newlyGeneratedToken" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--text)] flex items-center gap-2">
                            <UIcon name="i-heroicons-key" class="w-5 h-5 text-[var(--green)]" />
                            <span>{{ $t('api_tokens.modal_title') }}</span>
                        </h3>
                        <button v-if="!newlyGeneratedToken" type="button" class="icon-btn sm" @click="closeAddModal">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Token Revealed -->
                    <div v-if="newlyGeneratedToken" class="space-y-4">
                        <div class="bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.25)] p-4 rounded-xl flex gap-3">
                            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-[var(--amber)] shrink-0 mt-0.5" />
                            <div>
                                <h4 class="text-xs font-bold text-[var(--amber)]">{{ $t('api_tokens.important') }}</h4>
                                <p class="text-[11px] text-[var(--amber)]/80 mt-0.5">{{ $t('api_tokens.important_desc') }}</p>
                            </div>
                        </div>

                        <div class="p-3.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] break-all select-all font-mono text-xs text-[var(--green)] text-center shadow-inner">
                            {{ newlyGeneratedToken }}
                        </div>

                        <button type="button" class="btn-ref primary w-full justify-center" @click="closeAddModal">
                            {{ $t('api_tokens.copied') }}
                        </button>
                    </div>

                    <!-- Create Form -->
                    <form v-else @submit.prevent="generateToken" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('api_tokens.col_name') }}
                            </label>
                            <input
                                v-model="newTokenName"
                                type="text"
                                :placeholder="$t('api_tokens.name_placeholder')"
                                autofocus
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
                            <p class="text-[10px] text-[var(--text3)] mt-1">{{ $t('api_tokens.name_hint') }}</p>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                            <button type="button" class="btn-ref ghost" @click="isAddOpen = false">
                                {{ $t('common.cancel') }}
                            </button>
                            <button
                                type="submit"
                                class="btn-ref primary"
                                :disabled="addLoading || !newTokenName"
                            >
                                <UIcon v-if="addLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                                <span>{{ $t('api_tokens.btn_generate') }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>
