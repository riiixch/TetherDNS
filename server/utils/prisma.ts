import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../lib/prisma/client'

const libsqlConfig = {
    url: process.env.DATABASE_URL || 'file:./dev.db',
}

const adapter = new PrismaLibSql(libsqlConfig)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
