<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
const { t } = useI18n()
const toast = useToast()

interface HealthCheck {
    id: number
    name: string
    type: string
    target: string
    lastStatus: string | null
    lastCheckAt: string | null
}

const monitors = ref<HealthCheck[]>([])
const pending = ref(true)

const loadData = async () => {
    pending.value = true
    try {
        const res = await $fetch<{ data: HealthCheck[] }>('/api/monitoring')
        monitors.value = res.data
    } catch (e: any) {
        toast.add({ title: t('common.error'), description: e.message, color: 'error' })
    } finally {
        pending.value = false
    }
}

const columns = computed(() => [
    { accessorKey: 'name', header: t('monitoring.table_name') },
    { accessorKey: 'type', header: t('monitoring.table_type') },
    { accessorKey: 'target', header: t('monitoring.table_target') },
    { id: 'status', header: t('monitoring.table_status') },
    { id: 'lastCheck', header: t('monitoring.table_last_check') },
    { id: 'actions', header: '' }
])

const deleteMonitor = async (id: number) => {
    try {
        await $fetch(`/api/monitoring/${id}`, { method: 'DELETE' })
        toast.add({ title: t('common.success'), color: 'success' })
        loadData()
    } catch (e: any) {
        toast.add({ title: t('common.error'), description: e.message, color: 'error' })
    }
}

const showAddModal = ref(false)

onMounted(() => {
    loadData()
})
</script>

<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">{{ $t('monitoring.title') }}</h2>
            <UButton icon="i-heroicons-plus" @click="showAddModal = true">
                {{ $t('monitoring.btn_add') }}
            </UButton>
        </div>

        <UTable :data="monitors" :columns="columns" :loading="pending">
            <template #status-cell="{ row }">
                <UBadge :color="row.original.lastStatus === 'UP' ? 'success' : 'error'" variant="soft">
                    {{ row.original.lastStatus || 'PENDING' }}
                </UBadge>
            </template>
            <template #lastCheck-cell="{ row }">
                <span class="text-xs text-gray-500">
                    {{ row.original.lastCheckAt ? new Date(row.original.lastCheckAt).toLocaleString() : '-' }}
                </span>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex justify-end">
                    <UButton color="error" variant="ghost" icon="i-heroicons-trash"
                        @click="deleteMonitor(row.original.id)" />
                </div>
            </template>
        </UTable>

        <HealthCheckModal v-model:open="showAddModal" @success="loadData" />
    </div>
</template>
