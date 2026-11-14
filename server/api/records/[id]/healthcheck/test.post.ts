import { ProbeService } from '../../../../services/ProbeService'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.probeTarget) {
        throw createError({ statusCode: 400, statusMessage: 'probeTarget is required' })
    }

    try {
        const result = await ProbeService.executeProbe({
            probeType: body.probeType || 'HTTP',
            probeTarget: body.probeTarget,
            expectedStatus: body.expectedStatus ? parseInt(body.expectedStatus) : 200,
            timeoutSeconds: body.timeoutSeconds ? parseInt(body.timeoutSeconds) : 5
        })

        return {
            success: true,
            data: result
        }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message || 'Probe test failed' })
    }
})
