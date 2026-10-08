import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export function createDatabaseClient() {
    if (!process.env.DATABASE_URL?.trim()) {
        throw new Error('Заполни DATABASE_URL в локальном .env перед запуском API.');
    }
    return new PrismaClient();
}
