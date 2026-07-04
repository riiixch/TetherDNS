<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{ cfZoneId: string }>()
const emit = defineEmits(['close', 'refresh'])
const { addRecord } = useRecords()
const toast = useToast()
const { t } = useI18n()

const isOpen = ref(true)
const recordType = ref('A')
const recordName = ref('')
const recordContent = ref('')
const proxied = ref(false)
const ttl = ref(1) // Auto
const priority = ref(10)
const isLoading = ref(false)

// Tunnel & Routing Mode
const routingMode = ref('static') // 'static' | 'ddns' | 'tunnel'
const accountId = ref<number | null>(null)
const tunnels = ref<any[]>([])
const selectedTunnelId = ref<string>('')
const localAddress = ref('http://localhost:8080')

const ttlOptions = computed(() => [
    { label: t('records.ttl_auto'), value: 1 },
    { label: t('times.minutes', { n: 1 }), value: 60 },
    { label: t('times.minutes', { n: 5 }), value: 300 },
    { label: t('times.hours', { n: 1 }), value: 3600 }
])

const typeOptions = computed(() => {
    if (routingMode.value === 'ddns') {
        return [
            { label: 'A', value: 'A' },
            { label: 'AAAA', value: 'AAAA' }
        ]
    }
    return [
        { label: 'A', value: 'A' },
        { label: 'AAAA', value: 'AAAA' },
        { label: 'CNAME', value: 'CNAME' },
        { label: 'MX', value: 'MX' },
        { label: 'TXT', value: 'TXT' },
        { label: 'SRV', value: 'SRV' },
        { label: 'NS', value: 'NS' },
        { label: 'CAA', value: 'CAA' },
    ]
})

const routingModeOptions = [
    { label: 'Static / Manual', value: 'static' },
    { label: 'Auto DDNS', value: 'ddns' },
    { label: 'Cloudflare Tunnel', value: 'tunnel' }
]

const contentPlaceholder = computed(() => {
    switch (recordType.value) {
        case 'A': return t('records.placeholder_a')
        case 'AAAA': return t('records.placeholder_aaaa')
        case 'CNAME': return t('records.placeholder_cname')
        case 'MX': return t('records.placeholder_mx')
        case 'TXT': return t('records.placeholder_txt')
        case 'NS': return t('records.placeholder_ns')
        case 'CAA': return t('records.placeholder_caa')
        case 'SRV': return t('records.placeholder_srv')
        default: return ''
    }
})

const showPriority = computed(() => ['MX', 'SRV'].includes(recordType.value) && routingMode.value !== 'tunnel')
const showProxied = computed(() => ['A', 'AAAA', 'CNAME'].includes(recordType.value) && routingMode.value !== 'tunnel')

// Fetch zone's account
const fetchZoneAccount = async () => {
    try {
        const res = await $fetch<any>('/api/zones')
        if (res.success) {
            const currentZone = res.data.find((z: any) => z.cfZoneId === props.cfZoneId)
            if (currentZone) {
                accountId.value = currentZone.accountId
                fetchTunnels()
            }
        }
    } catch (e) {
        console.error(e)
    }
}

// Fetch tunnels
const fetchTunnels = async () => {
    if (!accountId.value) return
    try {
        const res = await $fetch<any>(`/api/tunnels?accountId=${accountId.value}`)
        if (res.success) {
            tunnels.value = res.data
            if (tunnels.value.length > 0) {
                selectedTunnelId.value = tunnels.value[0].tunnelId
            }
        }
    } catch (e) {
        console.error(e)
    }
}

watch(routingMode, (newVal) => {
    if (newVal === 'tunnel') {
        recordType.value = 'CNAME'
        proxied.value = true
    } else if (newVal === 'ddns') {
        if (recordType.value !== 'A' && recordType.value !== 'AAAA') {
            recordType.value = 'A'
        }
    }
})

const handleAdd = async () => {
    const isTunnel = routingMode.value === 'tunnel'
    
    if (!recordName.value) {
        toast.add({ title: t('common.failed'), description: 'Record Name is required', color: 'error' })
        return
    }

    if (!isTunnel && !recordContent.value) {
        toast.add({ title: t('common.failed'), description: t('records.err_required'), color: 'error' })
        return
    }

    if (isTunnel && !selectedTunnelId.value) {
        toast.add({ title: t('common.failed'), description: 'Please select a Cloudflare Tunnel', color: 'error' })
        return
    }

    isLoading.value = true
    try {
        const extraPayload: Record<string, any> = {
            routingMode: routingMode.value
        }

        if (isTunnel) {
            extraPayload.tunnelId = selectedTunnelId.value
            extraPayload.localAddress = localAddress.value
        }

        await addRecord(
            props.cfZoneId,
            recordType.value,
            recordName.value,
            isTunnel ? '' : recordContent.value,
            showProxied.value ? proxied.value : true,
            ttl.value,
            extraPayload
        )
        
        toast.add({ title: t('common.success'), description: t('records.add_success', { name: recordName.value }), color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('records.add_failed'),
            description: e.data?.statusMessage || e.message || t('common.err_occurred'),
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchZoneAccount()
})

watch(isOpen, (val) => { if (!val) emit('close') })
</script>

<template>
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-lg' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('records.add_modal_title') }}</h3>
                            <p class="text-xs text-slate-500 mt-0.5">{{ $t('records.add_modal_desc') }}</p>
                        </div>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                            @click="() => { isOpen = false }" />
                    </div>
                </template>

                <form @submit.prevent="handleAdd" class="space-y-5 py-2">
                    <!-- Routing Mode Selector -->
                    <UFormField label="Routing Mode" name="routingMode">
                        <USelect v-model="routingMode" :items="routingModeOptions" value-key="value" class="w-full"
                            :ui="{ base: 'rounded-xl h-10 font-bold' }" />
                    </UFormField>

                    <!-- Type (hidden or limited based on routingMode) -->
                    <UFormField v-if="routingMode !== 'tunnel'" :label="$t('records.type_field')" name="type">
                        <USelect v-model="recordType" :items="typeOptions" value-key="value" class="w-full"
                            :ui="{ base: 'rounded-xl h-10 font-bold' }" />
                    </UFormField>

                    <UFormField :label="$t('records.name_field')" name="name">
                        <UInput v-model="recordName" :placeholder="$t('records.name_placeholder')" class="w-full"
                            :ui="{ base: 'rounded-xl h-10 tracking-wide' }" />
                        <template #help>
                            <p class="text-[11px] text-slate-500 mt-1">{{ $t('records.name_hint') }}</p>
                        </template>
                    </UFormField>

                    <!-- Tunnel specific settings -->
                    <template v-if="routingMode === 'tunnel'">
                        <UFormField label="Cloudflare Tunnel" name="tunnelId">
                            <USelect
                                v-model="selectedTunnelId"
                                :items="tunnels.map(t => ({ label: t.name, value: t.tunnelId }))"
                                value-key="value"
                                class="w-full"
                                placeholder="Select a Tunnel"
                                :ui="{ base: 'rounded-xl h-10 font-bold' }"
                            />
                        </UFormField>

                        <UFormField label="Local Target Address" name="localAddress" help="The local address/port where traffic should be forwarded.">
                            <UInput v-model="localAddress" placeholder="e.g. http://localhost:8080" class="w-full font-mono"
                                :ui="{ base: 'rounded-xl h-10' }" />
                        </UFormField>
                    </template>

                    <!-- Manual/DDNS content input -->
                    <UFormField v-else :label="$t('records.content_field')" name="content">
                        <UInput v-model="recordContent" :placeholder="contentPlaceholder"
                            class="w-full font-mono text-sm" :ui="{ base: 'rounded-xl h-10' }" />
                    </UFormField>

                    <div class="grid grid-cols-2 gap-4">
                        <UFormField v-if="showPriority" :label="$t('records.priority_field')" name="priority">
                            <UInput v-model.number="priority" type="number" class="w-full"
                                :ui="{ base: 'rounded-xl h-10' }" />
                        </UFormField>

                        <UFormField :label="$t('records.ttl_field')" name="ttl"
                            :class="!showPriority ? 'col-span-1' : ''">
                            <USelect v-model="ttl" :items="ttlOptions" value-key="value" class="w-full"
                                :ui="{ base: 'rounded-xl h-10' }" />
                        </UFormField>
                    </div>

                    <UFormField v-if="showProxied" :label="$t('records.proxy_field')" name="proxied" class="pt-2">
                        <USwitch v-model="proxied" color="warning" />
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold" @click="() => { isOpen = false }">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isLoading"
                            class="rounded-xl font-bold px-6 shadow-sm">
                            {{ $t('records.add_record') }}
                        </UButton>
                    </div>
                </form>
            </UCard>
        </template>
    </UModal>
</template>