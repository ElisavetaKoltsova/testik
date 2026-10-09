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
    app.get<{ Querystring: { page?: string } }>(
        '/tests',
        { preHandler: requireTelegramUser(options.botToken) },
        async (request, reply) => {
            const page = request.query.page ?? '1';
            if (!/^[1-9]\d{0,3}$/.test(page))
                return reply.code(400).send({ error: 'Некорректная страница списка.' });
            if (!app.database)
                return reply
                    .code(503)
                    .send({ error: 'Не удалось загрузить тесты. Попробуй позже.' });
            try {
                const tests = await app.database.personalTest.findMany({
                    where: {
                        ownerTelegramId: BigInt(request.telegramUser!.id),
                        source: 'CUSTOM',
                        status: 'DRAFT',
                    },
                    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
                    skip: (Number(page) - 1) * 20,
                    take: 21,
                    select: { id: true, title: true, updatedAt: true },
                });
                return {
                    tests: tests.slice(0, 20).map((test) => ({
                        id: test.id,
                        title: test.title,
                        updatedAt: test.updatedAt.toISOString(),
                    })),
                    hasNext: tests.length > 20,
                };
            } catch {
                app.log.error('Не удалось загрузить список собственных тестов.');
                return reply
                    .code(503)
                    .send({ error: 'Не удалось загрузить тесты. Попробуй позже.' });
            }
        },
    );
    app.get<{ Params: { id: string } }>(
        '/tests/:id',
        { preHandler: requireTelegramUser(options.botToken) },
        async (request, reply) => {
            if (
                !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(
                    request.params.id,
                )
            )
                return reply.code(404).send({ error: 'Тест не найден.' });
            if (!app.database)
                return reply
                    .code(503)
                    .send({ error: 'Не удалось загрузить тест. Попробуй позже.' });
            try {
                const test = await app.database.personalTest.findFirst({
                    where: {
                        id: request.params.id,
                        ownerTelegramId: BigInt(request.telegramUser!.id),
                        source: 'CUSTOM',
                        status: 'DRAFT',
                    },
                    select: { id: true, title: true, content: true },
                });
                if (!test) return reply.code(404).send({ error: 'Тест не найден.' });
                const content = test.content as { questions?: unknown } | null;
                const draft = parseCustomTest({ title: test.title, questions: content?.questions });
                if (!draft) throw new Error('Invalid stored test');
                return { id: test.id, draft };
            } catch {
                app.log.error('Не удалось загрузить собственный тест.');
                return reply
                    .code(503)
                    .send({ error: 'Не удалось загрузить тест. Попробуй позже.' });
            }
        },
    );
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
