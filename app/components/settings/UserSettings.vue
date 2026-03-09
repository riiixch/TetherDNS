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

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH')
}
</script>

<template>
    <UCard
        class="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xl rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800/50">
        <template #header>
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary-500" />
                    <div>
                        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">{{
                            $t('settings.users_title') }}</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400 font-sans">{{ $t('settings.users_subtitle')
                        }}</p>
                    </div>
                </div>
                <UButton icon="i-heroicons-plus" color="primary" class="rounded-xl font-bold font-sans px-4"
                    @click="isAddOpen = true">
                    {{ $t('settings.add_user') }}
                </UButton>
            </div>
        </template>

        <UTable :data="users" :columns="columns" :loading="loading" :ui="{
            th: 'bg-transparent text-slate-900 dark:text-slate-100 font-bold font-sans uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-800/50',
            td: 'py-4 font-sans'
        }">
            <template #username-cell="{ row }">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 dark:text-slate-200">{{ row.original.username }}</span>
                    <UBadge v-if="currentUser?.id === row.original.id" color="primary" variant="soft" size="sm"
                        class="rounded-lg font-black text-[10px] tracking-widest px-2 uppercase">
                        {{ $t('settings.you') }}
                    </UBadge>
                </div>
            </template>
            <template #createdAt-cell="{ row }">
                <span class="text-slate-500 dark:text-slate-400 text-sm italic">{{ formatDate(row.original.createdAt)
                }}</span>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end">
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        class="rounded-lg hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                        :disabled="currentUser?.id === row.original.id" @click="emit('delete', row.original.id)" />
                </div>
            </template>
        </UTable>

        <UModal v-model:open="isAddOpen" :title="$t('settings.add_user_modal')"
            :description="$t('settings.add_user_overlay')" :ui="{
                content: 'dark:bg-slate-900/90 backdrop-blur-2xl border-slate-800/50 rounded-3xl',
                header: 'font-black tracking-tight text-xl font-sans'
            }">
            <template #body>
                <form @submit.prevent="add" class="space-y-6">
                    <UFormField :label="$t('settings.username')" name="username">
                        <UInput v-model="newUserPayload.username" :placeholder="$t('settings.username')" class="w-full"
                            :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>

                    <UFormField :label="$t('settings.password')" name="password">
                        <UInput v-model="newUserPayload.password" type="password" :placeholder="$t('settings.password')"
                            class="w-full" :ui="{ base: 'rounded-xl h-12 font-sans' }" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold"
                            @click="isAddOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isAdding" class="rounded-xl font-bold px-8">{{
                            $t('settings.create_user') }}
                        </UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
