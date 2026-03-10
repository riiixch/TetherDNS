<script setup lang="ts">
import { ref, computed } from 'vue'

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

const columns = computed(() => [
    { accessorKey: 'username', header: t('settings.col_username') },
    { accessorKey: 'createdAt', header: t('settings.col_created') },
    { id: 'actions', header: '' },
])

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
    return new Date(dateStr).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <UCard :ui="{ header: 'px-5 sm:px-6 py-5', body: 'p-0 sm:p-0' }"
        class="bg-white dark:bg-slate-900 shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
        <template #header>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                        <UIcon name="i-heroicons-users-solid" class="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{{
                            $t('settings.users_title') }}</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('settings.users_subtitle') }}
                        </p>
                    </div>
                </div>
                <UButton icon="i-heroicons-plus" color="primary"
                    class="rounded-xl font-bold px-4 shadow-sm w-full md:w-auto justify-center"
                    @click="isAddOpen = true">
                    {{ $t('settings.add_user') }}
                </UButton>
            </div>
        </template>

        <div class="overflow-x-auto">
            <UTable :data="users" :columns="columns" :loading="loading" :ui="{
                th: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap py-3.5 border-b border-slate-200 dark:border-slate-800',
                td: 'py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60',
                tr: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'
            }">
                <template #username-cell="{ row }">
                    <div class="flex items-center gap-2.5">
                        <span class="font-semibold text-slate-900 dark:text-white">{{ row.original.username }}</span>
                        <UBadge v-if="currentUser?.id === row.original.id" color="primary" variant="subtle" size="xs"
                            class="font-bold uppercase tracking-widest">
                            {{ $t('settings.you') }}
                        </UBadge>
                    </div>
                </template>
                <template #createdAt-cell="{ row }">
                    <span class="text-slate-500 dark:text-slate-400 text-xs font-medium">{{
                        formatDate(row.original.createdAt) }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end">
                        <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
                            class="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            :disabled="currentUser?.id === row.original.id" @click="emit('delete', row.original.id)" />
                    </div>
                </template>
            </UTable>
        </div>

        <UModal v-model:open="isAddOpen" :ui="{ content: 'sm:max-w-md' }">
            <template #content>
                <UCard class="ring-0">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('settings.add_user_modal') }}</h3>
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                                @click="isAddOpen = false" />
                        </div>
                    </template>

                    <form @submit.prevent="add" class="space-y-5 py-2">
                        <UFormField :label="$t('settings.username')" name="username">
                            <UInput v-model="newUserPayload.username" :placeholder="$t('settings.username')"
                                class="w-full" :ui="{ root: 'rounded-xl' }" autofocus />
                        </UFormField>

                        <UFormField :label="$t('settings.password')" name="password">
                            <UInput v-model="newUserPayload.password" type="password"
                                :placeholder="$t('settings.password')" class="w-full" :ui="{ root: 'rounded-xl' }" />
                        </UFormField>

                        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                                @click="isAddOpen = false">
                                {{ $t('common.cancel') }}
                            </UButton>
                            <UButton type="submit" color="primary" :loading="isAdding"
                                class="rounded-xl font-bold px-6 shadow-sm"
                                :disabled="!newUserPayload.username || !newUserPayload.password">
                                {{ $t('settings.create_user') }}
                            </UButton>
                        </div>
                    </form>
                </UCard>
            </template>
        </UModal>
    </UCard>
</template>