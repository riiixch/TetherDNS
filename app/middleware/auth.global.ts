export default defineNuxtRouteMiddleware(async (to, from) => {
    const { checkSetupStatus, user, checkSession } = useAuth()

    // 1. Check if first-time setup is needed
    const isSetupRequired = await checkSetupStatus()

    if (isSetupRequired) {
        if (to.path !== '/setup') {
            return navigateTo('/setup')
        }
        return // Allow access to /setup
    }

    // 2. If setup is done, prevent access to /setup
    if (!isSetupRequired && to.path === '/setup') {
        return navigateTo('/login')
    }

    await checkSession()

    // 3. We are using cookies, let's check if the user is authenticated. 
    // Usually we’d have a /api/auth/session or we can rely on a useCookie or an API call to verify.
    // For simplicity, if we are hitting standard routes and the backend rejects 401, we handle it on fetch,
    // but for route guarding, we can check a simple API endpoint to see if session exists.

    // However, in SSR/Nuxt, calling an API on every route change can be slow. 
    // We'll write a quick /api/auth/session endpoint in the next step to fetch the `user` state on initial load.

    // If not authenticated and not on login, redirect to login
    if (!user.value && to.path !== '/login') {
        // Attempt to fetch session
        const f = import.meta.client ? (globalThis as any).$fetch : useRequestFetch()
        const data = await (f as any)('/api/auth/session')

        if (data && data.user) {
            user.value = data.user
        } else {
            return navigateTo('/login')
        }
    }

    // 4. If authenticated and trying to access login, redirect to dashboard
    if (user.value && to.path === '/login') {
        return navigateTo('/')
    }
})
