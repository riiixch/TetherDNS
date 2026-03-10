<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    accounts: any[]
}>()
const emit = defineEmits(['close', 'refresh'])

const { addZone } = useZones()
const toast = useToast()
const { t } = useI18n()

const isOpen = ref(true)
const domainName = ref('')
const selectedAccountId = ref<number | null>(props.accounts.length > 0 ? props.accounts[0].id : null)
const isLoading = ref(false)

const accountOptions = computed(() =>
    props.accounts.map((a: any) => ({ label: `${a.label} (${a.email})`, value: a.id }))
)

const handleAdd = async () => {
    if (!domainName.value) {
        toast.add({ title: t('common.failed'), description: t('zones.err_domain'), color: 'error' })
        return
    }
    if (!selectedAccountId.value) {
        toast.add({ title: t('common.failed'), description: t('zones.err_account'), color: 'error' })
        return
    }

    isLoading.value = true
    try {
        await addZone(domainName.value, selectedAccountId.value)
        toast.add({ title: t('common.success'), description: t('zones.add_success', { name: domainName.value }), color: 'success' })
        isOpen.value = false
        emit('refresh')
        emit('close')
    } catch (e: any) {
        toast.add({
            title: t('zones.add_failed'),
            description: e.data?.statusMessage || e.message || t('common.err_occurred'),
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

watch(isOpen, (val) => {
    if (!val) emit('close')
})
</script>

<template>
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-md' }">
        <template #content>
            <UCard :ui="{ body: 'divide-y divide-slate-200 dark:divide-slate-800' }" class="ring-0">

                <template #header>
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{
                                $t('zones.add_modal_title') }}</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('zones.add_modal_desc')
                                }}</p>
                        </div>
                        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" class="-my-1"
                            @click="isOpen = false" />
                    </div>
                </template>

                <form @submit.prevent="handleAdd" class="space-y-5 py-2">

                    <UFormField :label="$t('zones.account_field')" name="account">
                        <USelect v-model="selectedAccountId" :items="accountOptions" value-key="value"
                            :placeholder="$t('zones.account_placeholder')" class="w-full"
                            :ui="{ base: 'rounded-xl h-10' }" />
                        <template #help>
                            <p class="text-[11px] text-slate-500 mt-1">{{ $t('zones.account_hint') }}</p>
                        </template>
                    </UFormField>

                    <UFormField :label="$t('zones.domain_field')" name="domain">
                        <UInput v-model="domainName" :placeholder="$t('zones.domain_placeholder')" class="w-full"
                            :ui="{ root: 'rounded-xl h-10' }" autofocus />
                        <template #help>
                            <p class="text-[11px] text-slate-500 mt-1">{{ $t('zones.domain_hint') }}</p>
                        </template>
                    </UFormField>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <UButton color="neutral" variant="ghost" class="rounded-xl font-bold" @click="isOpen = false">
                            {{ $t('common.cancel') }}
                        </UButton>
                        <UButton type="submit" color="primary" :loading="isLoading"
                            class="rounded-xl font-bold px-6 shadow-sm">
                            {{ $t('zones.add_zone') }}
                        </UButton>
                    </div>

                </form>
            </UCard>
        </template>
    </UModal>
</template>