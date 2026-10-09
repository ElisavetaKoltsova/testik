import type { preHandlerHookHandler } from 'fastify';
import { validateTelegramInitData } from './telegram.js';
import type { TelegramUser } from './telegram.js';

export function requireTelegramUser(botToken?: string): preHandlerHookHandler {
    return async (request, reply) => {
        const authorization = request.headers.authorization;
        if (!authorization?.toLowerCase().startsWith('tma ') || !authorization.slice(4)) {
            return reply.code(401).send({ error: 'Открой приложение через Telegram.' });
        }
        if (!botToken) {
            return reply.code(503).send({ error: 'Вход через Telegram пока недоступен.' });
        }
        const user = validateTelegramInitData(authorization.slice(4), botToken);
        if (!user) {
            return reply.code(401).send({ error: 'Открой приложение заново через Telegram.' });
        }
        request.telegramUser = user;
    };
}

declare module 'fastify' {
    interface FastifyRequest {
        telegramUser: TelegramUser | null;
    }
}
