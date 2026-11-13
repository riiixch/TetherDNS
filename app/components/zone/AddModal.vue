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
            <div class="card card-ref p-6 space-y-4">
                <div class="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div>
                        <h3 class="text-base font-bold text-[var(--text)]">{{ $t('zones.add_modal_title') }}</h3>
                        <p class="text-xs text-[var(--text3)] mt-0.5">{{ $t('zones.add_modal_desc') }}</p>
                    </div>
                    <button type="button" class="icon-btn sm" @click="isOpen = false">
                        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                    </button>
                </div>

                <form @submit.prevent="handleAdd" class="space-y-4">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            {{ $t('zones.account_field') }}
                        </label>
                        <select v-model="selectedAccountId" class="input select w-full">
                            <option v-for="opt in accountOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                        <p class="text-[11px] text-[var(--text3)]">{{ $t('zones.account_hint') }}</p>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-[var(--text2)] uppercase tracking-wider">
                            {{ $t('zones.domain_field') }}
                        </label>
                        <input
                            v-model="domainName"
                            type="text"
                            :placeholder="$t('zones.domain_placeholder')"
                            class="input mono w-full"
                            autofocus
                        />
                        <p class="text-[11px] text-[var(--text3)]">{{ $t('zones.domain_hint') }}</p>
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                        <button type="button" class="btn-ref ghost" @click="isOpen = false">
                            {{ $t('common.cancel') }}
                        </button>
                        <button type="submit" class="btn-ref primary" :disabled="isLoading">
                            <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                            <span>{{ $t('zones.add_zone') }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </UModal>
</template>
