import { prisma } from './prisma'

export async function logAudit(userId: number, action: string, target: string, details?: any) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                target,
                details: details ? JSON.stringify(details) : null
            }
        })
    } catch (error) {
        console.error('[Audit] Failed to log action:', error)
    }
}
