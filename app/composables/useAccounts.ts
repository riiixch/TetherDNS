export const useAccounts = () => {
    const fetchAccounts = async () => {
        const data = await $fetch<{ data: any[] }>('/api/accounts')
        return data?.data || []
    }

    const addAccount = async (label: string, email: string, apiToken: string) => {
        const data = await $fetch('/api/accounts', {
            method: 'POST',
            body: { label, email, apiToken }
        })
        return data
    }

    const deleteAccount = async (id: number) => {
        const data = await $fetch(`/api/accounts/${id}`, {
            method: 'DELETE'
        })
        return data
    }

    return { fetchAccounts, addAccount, deleteAccount }
}
