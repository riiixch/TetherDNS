export const useZones = () => {
    const fetchZones = async () => {
        const data = await $fetch<{ data: any[] }>('/api/zones')
        return data?.data || []
    }

    const addZone = async (name: string, accountId: number) => {
        const data = await $fetch('/api/zones', {
            method: 'POST',
            body: { name, accountId }
        })
        return data
    }

    const deleteZone = async (id: string) => {
        const data = await $fetch(`/api/zones/${id}`, {
            method: 'DELETE'
        })
        return data
    }

    return { fetchZones, addZone, deleteZone }
}
