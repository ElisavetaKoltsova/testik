import type { FastifyPluginAsync } from 'fastify';
import { requireTelegramUser } from '../../auth/index.js';

interface CurrentUserOptions {
    botToken?: string;
}

const errorResponseSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['error'],
    properties: { error: { type: 'string' } },
};

export const currentUserRoutes: FastifyPluginAsync<CurrentUserOptions> = async (app, options) => {
    app.addHook('onRequest', async (_request, reply) => {
        reply.header('Cache-Control', 'no-store');
        reply.header('Vary', 'Authorization');
    });

    app.get(
        '/me',
        {
            preHandler: requireTelegramUser(options.botToken),
            schema: {
                response: {
                    401: errorResponseSchema,
                    503: errorResponseSchema,
                    200: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['user'],
                        properties: {
                            user: {
                                type: 'object',
                                additionalProperties: false,
                                required: ['id', 'firstName'],
                                properties: {
                                    id: { type: 'string' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    username: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            if (!request.telegramUser) {
                return reply.code(401).send({ error: 'Не удалось подтвердить вход.' });
            }
            return { user: request.telegramUser };
        },
    );
};
