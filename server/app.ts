import Fastify from 'fastify';
import { healthRoutes } from './routes/health/index.js';

export function buildApp({ logger = false }: { logger?: boolean } = {}) {
    const app = Fastify({ logger });
    app.register(healthRoutes, { prefix: '/api' });
    return app;
}
