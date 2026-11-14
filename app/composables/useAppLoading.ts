import { ref } from 'vue'

const isLoading = ref(false)
const loadingMessage = ref('')
const loadingProgress = ref<number | null>(null)

export const useAppLoading = () => {
    const startLoading = (message = '', progress: number | null = null) => {
        loadingMessage.value = message
        loadingProgress.value = progress
        isLoading.value = true
    }

    const setProgress = (progress: number, message?: string) => {
        loadingProgress.value = progress
        if (message !== undefined) {
            loadingMessage.value = message
        }
    }

    const stopLoading = () => {
        isLoading.value = false
        loadingMessage.value = ''
        loadingProgress.value = null
    }

    return {
        isLoading,
        loadingMessage,
        loadingProgress,
        startLoading,
        setProgress,
        stopLoading
    }
}

