import { ref } from 'vue'

const isLoading = ref(false)
const loadingTitle = ref('TetherDNS')
const loadingSubtitle = ref('Cloudflare DDNS & Edge Manager')
const loadingMessage = ref('')
const loadingProgress = ref<number | null>(null)
let safetyTimer: ReturnType<typeof setTimeout> | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null

export const useAppLoading = () => {
    const startLoading = (message = '', subtitle = 'Cloudflare DDNS & Edge Manager', title = 'TetherDNS') => {
        if (stopTimer) {
            clearTimeout(stopTimer)
            stopTimer = null
        }
        if (safetyTimer) {
            clearTimeout(safetyTimer)
        }

        loadingTitle.value = title
        loadingSubtitle.value = subtitle
        if (message) loadingMessage.value = message
        loadingProgress.value = null
        isLoading.value = true

        // Safety fallback: auto-dismiss after 8 seconds so it never traps the user
        safetyTimer = setTimeout(() => {
            if (isLoading.value) {
                isLoading.value = false
            }
        }, 8000)
    }

    const setProgress = (progress: number, message?: string) => {
        loadingProgress.value = progress
        if (message !== undefined) {
            loadingMessage.value = message
        }
    }

    const stopLoading = (delay = 250) => {
        if (safetyTimer) {
            clearTimeout(safetyTimer)
            safetyTimer = null
        }
        if (stopTimer) {
            clearTimeout(stopTimer)
        }

        if (delay > 0) {
            stopTimer = setTimeout(() => {
                isLoading.value = false
                loadingProgress.value = null
                stopTimer = null
            }, delay)
        } else {
            isLoading.value = false
            loadingProgress.value = null
        }
    }

    return {
        isLoading,
        loadingTitle,
        loadingSubtitle,
        loadingMessage,
        loadingProgress,
        startLoading,
        setProgress,
        stopLoading
    }
}
