import Fastify from 'fastify';
import { healthRoutes } from './routes/health/index.js';
import type { PrismaClient } from '@prisma/client';

interface AppOptions {
    logger?: boolean;
    database?: PrismaClient;
}

export function buildApp({ logger = false, database }: AppOptions = {}) {
    const app = Fastify({ logger });
    if (database) {
        app.decorate('database', database);
        app.addHook('onReady', async () => {
            await database.$queryRaw`SELECT 1`;
        });
        app.addHook('onClose', async () => {
            await database.$disconnect();
        });
    }
    app.register(healthRoutes, { prefix: '/api' });
    return app;
}

declare module 'fastify' {
    interface FastifyInstance {
        database?: PrismaClient;
    }
}
