import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
    app.get(
        '/health',
        {
            schema: {
                response: {
                    200: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['status', 'service'],
                        properties: {
                            status: { type: 'string', const: 'ok' },
                            service: { type: 'string', const: 'testik-api' },
                        },
                    },
                },
            },
        },
        async () => ({ status: 'ok', service: 'testik-api' }),
    );
};
