import Fastify from 'fastify';
import { healthRoutes } from './routes/health/index.js';
import { currentUserRoutes } from './routes/currentUser/index.js';
import { personalTestRoutes } from './routes/personalTests/index.js';
import type { PrismaClient } from '@prisma/client';

interface AppOptions {
    logger?: boolean;
    database?: PrismaClient;
    botToken?: string;
}

export function buildApp({ logger = false, database, botToken }: AppOptions = {}) {
    const app = Fastify({
        logger: logger ? { redact: ['req.headers.authorization', 'req.headers.cookie'] } : false,
    });
    app.decorateRequest('telegramUser', null);
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
    app.register(currentUserRoutes, { prefix: '/api', botToken });
    app.register(personalTestRoutes, { prefix: '/api', botToken });
    return app;
}

declare module 'fastify' {
    interface FastifyInstance {
        database?: PrismaClient;
    }
}
