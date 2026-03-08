export const useAuth = () => {
    const user = useState<{ id: number; username: string } | null>('user', () => null)

    const checkSetupStatus = async () => {
        try {
            const f = import.meta.client ? (globalThis as any).$fetch : useRequestFetch()
            const data = await (f as any)('/api/auth/check')
            return data?.isSetupRequired ?? false
        } catch (e) {
            console.error('Failed to check setup status', e)
            return false
        }
    }

    const login = async (username: string, password: string) => {
        // For manual actions like login, use $fetch, not useFetch
        const response = await $fetch('/api/auth/login', {
            method: 'POST',
            body: { username, password }
        })

        // Refresh session state after login
        await checkSession()
        return true
    }

    const setup = async (username: string, password: string) => {
        const response = await $fetch('/api/auth/setup', {
            method: 'POST',
            body: { username, password }
        })

        // Refresh session state after setup
        await checkSession()
        return true
    }

    const checkSession = async () => {
        try {
            const f = import.meta.client ? (globalThis as any).$fetch : useRequestFetch()
            const data = await (f as any)('/api/auth/session')
            if (data && data.user) {
                user.value = data.user
                return true
            }
            user.value = null
            return false
        } catch (e) {
            user.value = null
            return false
        }
    }

    const logout = async () => {
        await $fetch('/api/auth/logout', { method: 'POST' })
        user.value = null
        navigateTo('/login')
    }

    return {
        user,
        checkSetupStatus,
        checkSession,
        login,
        setup,
        logout
    }
}
