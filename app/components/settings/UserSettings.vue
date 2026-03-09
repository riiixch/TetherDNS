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
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold">{{ $t('settings.users_title') }}</h2>
                    <p class="text-sm text-gray-400">{{ $t('settings.users_subtitle') }}</p>
                </div>
                <UButton icon="i-heroicons-plus" color="primary" @click="isAddOpen = true">
                    {{ $t('settings.add_user') }}
                </UButton>
            </div>
        </template>

        <UTable :data="users" :columns="columns" :loading="loading">
            <template #username-cell="{ row }">
                <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-200">{{ row.original.username }}</span>
                    <UBadge v-if="currentUser?.id === row.original.id" color="primary" variant="subtle" size="sm">{{
                        $t('settings.you') }}</UBadge>
                </div>
            </template>
            <template #createdAt-cell="{ row }">
                <span class="text-gray-400 text-sm">{{ formatDate(row.original.createdAt) }}</span>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end">
                    <UButton size="sm" color="error" variant="ghost" icon="i-heroicons-trash"
                        :disabled="currentUser?.id === row.original.id" @click="emit('delete', row.original.id)" />
                </div>
            </template>
        </UTable>

        <UModal v-model:open="isAddOpen" :title="$t('settings.add_user_modal')"
            :description="$t('settings.add_user_overlay')">
            <template #body>
                <form @submit.prevent="add" class="space-y-4">
                    <UFormField :label="$t('settings.username')" name="username">
                        <UInput v-model="newUserPayload.username" :placeholder="$t('settings.username')"
                            class="w-full" />
                    </UFormField>

                    <UFormField :label="$t('settings.password')" name="password">
                        <UInput v-model="newUserPayload.password" type="password" :placeholder="$t('settings.password')"
                            class="w-full" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-2">
                        <UButton color="neutral" variant="ghost" @click="isAddOpen = false">{{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isAdding">{{ $t('settings.create_user') }}
                        </UButton>
                    </div>
                </form>
            </template>
        </UModal>
    </UCard>
</template>
