export async function fetchFromTarget(url: string): Promise<string | null> {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) return null

        const text = (await response.text()).trim()

        // Try to parse as JSON
        try {
            const json = JSON.parse(text)
            if (json.ip) return json.ip
        } catch { }

        // If not JSON, validate as IP (basic check)
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(text) || /^[a-fA-F0-9:]+$/.test(text)) {
            return text
        }

        return null
    } catch {
        return null
    }
}
