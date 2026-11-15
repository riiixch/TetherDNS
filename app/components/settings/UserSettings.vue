<script setup lang="ts">
import { ref } from 'vue'

const { t } = useI18n()

const props = defineProps<{
    users: any[]
    loading: boolean
    currentUser: any
}>()

const emit = defineEmits(['add', 'delete'])

const isAddOpen = ref(false)
const newUserPayload = ref({ username: '', password: '' })
const isAdding = ref(false)

const add = async () => {
    isAdding.value = true
    try {
        await emit('add', { ...newUserPayload.value })
        isAddOpen.value = false
        newUserPayload.value = { username: '', password: '' }
    } finally {
        isAdding.value = false
    }
}

const { locale } = useI18n()

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(locale.value === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <div class="space-y-6">
        <div class="card set-card overflow-hidden">
            <div class="card-head flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div class="card-title">
                    <UIcon name="i-heroicons-users" class="w-4 h-4 text-[var(--cyan)]" />
                    <span>{{ $t('settings.users_title') }}</span>
                </div>
                <button
                    type="button"
                    class="btn-ref primary sm"
                    @click="isAddOpen = true"
                >
                    <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                    <span>{{ $t('settings.add_user') }}</span>
                </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-12">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--green)]" />
            </div>

            <!-- Empty State -->
            <div v-else-if="users.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                <div class="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-3">
                    <UIcon name="i-heroicons-users" class="w-6 h-6 text-[var(--text3)]" />
                </div>
                <p class="text-xs text-[var(--text2)]">No users found</p>
            </div>

            <template v-else>
                <!-- Desktop Table (hidden on mobile < 640px) -->
                <div class="overflow-x-auto w-full hidden sm:block">
                    <table class="rtable-ref w-full">
                        <thead>
                            <tr>
                                <th class="w-1/2 min-w-[180px]">{{ $t('settings.col_username') }}</th>
                                <th class="w-2/5 min-w-[140px]">{{ $t('settings.col_created') }}</th>
                                <th class="w-20 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in users" :key="u.id">
                                <td>
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-[var(--text)]">{{ u.username }}</span>
                                        <span v-if="currentUser?.id === u.id" class="chip green text-[10px]">
                                            {{ $t('settings.you') }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span class="text-xs text-[var(--text2)] font-mono">{{ formatDate(u.createdAt) }}</span>
                                </td>
                                <td class="text-right">
                                    <button
                                        v-if="currentUser?.id !== u.id"
                                        type="button"
                                        class="icon-btn sm text-[var(--danger)] hover:bg-[rgba(251,94,122,0.15)] inline-flex items-center justify-center"
                                        @click="emit('delete', u.id)"
                                    >
                                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile User List (shown only on mobile < 640px) -->
                <div class="user-mobile-list block sm:hidden divide-y divide-[var(--border)]">
                    <div
                        v-for="u in users"
                        :key="'mob-u-' + u.id"
                        class="p-4 flex items-center justify-between gap-3 hover:bg-[var(--surface2)]/40 transition-colors"
                    >
                        <div class="min-w-0 space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-sm text-[var(--text)] truncate">{{ u.username }}</span>
                                <span v-if="currentUser?.id === u.id" class="chip green text-[10px] shrink-0">
                                    {{ $t('settings.you') }}
                                </span>
                            </div>
                            <div class="text-[11px] text-[var(--text3)] font-mono">
                                {{ formatDate(u.createdAt) }}
                            </div>
                        </div>

                        <button
                            v-if="currentUser?.id !== u.id"
                            type="button"
                            class="icon-btn sm text-[var(--danger)] hover:bg-[rgba(251,94,122,0.15)] shrink-0"
                            @click="emit('delete', u.id)"
                        >
                            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </template>
        </div>

        <!-- Add User Modal -->
        <UModal v-model:open="isAddOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <div class="card card-ref p-6 space-y-4">
                    <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <h3 class="font-bold text-base text-[var(--text)] flex items-center gap-2">
                            <UIcon name="i-heroicons-user-plus" class="w-5 h-5 text-[var(--green)]" />
                            <span>{{ $t('settings.add_user_modal') }}</span>
                        </h3>
                        <button type="button" class="icon-btn sm" @click="isAddOpen = false">
                            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <form @submit.prevent="add" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.username') }}
                            </label>
                            <input
                                v-model="newUserPayload.username"
                                type="text"
                                required
                                autofocus
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-[var(--text2)] mb-1">
                                {{ $t('settings.password') }}
                            </label>
                            <input
                                v-model="newUserPayload.password"
                                type="password"
                                required
                                class="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--green)]"
                            />
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                            <button type="button" class="btn-ref ghost" @click="isAddOpen = false">
                                {{ $t('common.cancel') }}
                            </button>
                            <button
                                type="submit"
                                class="btn-ref primary"
                                :disabled="isAdding"
                            >
                                <UIcon v-if="isAdding" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                                <span>{{ $t('settings.add_user') }}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>
