export const useRecords = () => {
    const fetchRecords = async (cfZoneId: string) => {
        const data = await $fetch<{ data: any[] }>('/api/records', {
            params: { cfZoneId }
        })
        return data?.data || []
    }

    const addRecord = async (cfZoneId: string, type: string, name: string, content: string, proxied: boolean, ttl: number) => {
        return await $fetch('/api/records', {
            method: 'POST',
            body: { cfZoneId, type, name, content, proxied, ttl }
        })
    }

    const updateRecord = async (recordId: number, data: Record<string, any>) => {
        return await $fetch(`/api/records/${recordId}`, {
            method: 'PATCH',
            body: data
        })
    }

    const deleteRecord = async (recordId: number) => {
        return await $fetch(`/api/records/${recordId}`, {
            method: 'DELETE'
        })
    }

    const toggleAutoUpdate = async (recordId: number, isAutoUpdate: boolean) => {
        return await $fetch(`/api/records/${recordId}`, {
            method: 'PATCH',
            body: { isAutoUpdate }
        })
    }

    return { fetchRecords, addRecord, updateRecord, deleteRecord, toggleAutoUpdate }
}
