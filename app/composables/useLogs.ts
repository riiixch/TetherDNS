export const useLogs = () => {
    const fetchLogs = async (params: { page?: number; limit?: number; status?: string; zoneId?: string; search?: string } = {}) => {
        const data = await $fetch<{ data: any[]; pagination: any }>('/api/logs', { params })
        return data
    }

    return { fetchLogs }
}
