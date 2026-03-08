import { createCloudflareClient } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })
    }

    try {
        const record = await prisma.dnsRecord.findUnique({
            where: { id: parseInt(id) },
            include: { zone: true }
        })

        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })
        if (!record.zone.accountId) throw createError({ statusCode: 400, statusMessage: 'Zone has no linked account' })

        const cf = await createCloudflareClient(record.zone.accountId)

        // Build update payload — only include fields that were provided
        const updatePayload: any = {
            zone_id: record.zone.cfZoneId,
            type: body.type || record.type,
            name: body.name || record.name,
            content: body.content || record.content,
        }
        if (typeof body.proxied === 'boolean') updatePayload.proxied = body.proxied
        if (typeof body.isAutoUpdate === 'boolean') {
            // isAutoUpdate is local-only, not sent to Cloudflare
        }

        // Update on Cloudflare
        await cf.dns.records.edit(record.cfRecordId, updatePayload as any)

        // Update local DB
        const dbUpdate: any = {}
        if (body.type) dbUpdate.type = body.type
        if (body.name) dbUpdate.name = body.name
        if (body.content) dbUpdate.content = body.content
        if (typeof body.proxied === 'boolean') dbUpdate.proxied = body.proxied
        if (typeof body.isAutoUpdate === 'boolean') dbUpdate.isAutoUpdate = body.isAutoUpdate

        const updated = await prisma.dnsRecord.update({
            where: { id: parseInt(id) },
            data: dbUpdate
        })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'UPDATE_RECORD',
                `Record: ${updated.name} (${updated.type})`,
                { updateDetails: dbUpdate }
            )
        }

        return {
            success: true,
            data: updated,
            message: `Record ${updated.name} updated successfully.`
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to update record'
        })
    }
})
