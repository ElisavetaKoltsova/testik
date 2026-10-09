import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import { requireTelegramUser } from '../../auth/index.js';
import { parseCustomTest } from '../../tests/customTest.js';

interface PersonalTestsOptions {
    botToken?: string;
}

export const personalTestRoutes: FastifyPluginAsync<PersonalTestsOptions> = async (
    app,
    options,
) => {
    app.addHook('onRequest', async (_request, reply) => {
        reply.header('Cache-Control', 'no-store');
    });
    app.put<{ Params: { id: string }; Body: unknown }>(
        '/tests/:id',
        {
            bodyLimit: 128 * 1024,
            preHandler: requireTelegramUser(options.botToken),
        },
        async (request, reply) => {
            const user = request.telegramUser;
            if (!user)
                return reply.code(401).send({ error: 'Открой приложение заново через Telegram.' });
            if (
                !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(
                    request.params.id,
                )
            ) {
                return reply.code(400).send({ error: 'Некорректный идентификатор теста.' });
            }
            const input = parseCustomTest(request.body);
            if (!input)
                return reply.code(400).send({
                    error: 'Заполни название, 1–10 вопросов и 2–6 ответов в каждом. Проверь длину текстов.',
                });
            const database = app.database;
            if (!database)
                return reply
                    .code(503)
                    .send({ error: 'Сохранение пока недоступно. Попробуй позже.' });

            try {
                const ownerTelegramId = BigInt(user.id);
                // Дополнительные условия запрещают обновлять чужой или опубликованный тест.
                const saved = await database.personalTest.upsert({
                    where: {
                        id: request.params.id,
                        ownerTelegramId,
                        status: 'DRAFT',
                        source: 'CUSTOM',
                    },
                    create: {
                        id: request.params.id,
                        ownerTelegramId,
                        title: input.title,
                        source: 'CUSTOM',
                        content: { questions: input.questions },
                    },
                    update: { title: input.title, content: { questions: input.questions } },
                    select: { id: true, updatedAt: true },
                });
                return { id: saved.id, savedAt: saved.updatedAt.toISOString() };
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    ['P2002', 'P2025'].includes(error.code)
                ) {
                    return reply
                        .code(409)
                        .send({ error: 'Этот тест недоступен для редактирования.' });
                }
                app.log.error('Не удалось сохранить собственный тест в базе.');
                return reply
                    .code(503)
                    .send({ error: 'Не удалось сохранить тест. Попробуй ещё раз.' });
            }
        },
    );
};
