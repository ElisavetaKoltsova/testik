import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { buildApp } from '../app.js';
import { createDatabaseClient } from './index.js';
import { testBotToken, testTelegramAuthorization } from '../testing/telegram.js';

test('PostgreSQL preserves mode, correct option, scores and ranges through save/read/update', async () => {
    const database = createDatabaseClient();
    const id = randomUUID();
    const rollback = new Error('rollback-scoring-test');
    try {
        await assert.rejects(
            database.$transaction(
                async (transaction) => {
                    const app = buildApp({
                        botToken: testBotToken,
                        database: {
                            personalTest: transaction.personalTest,
                            $queryRaw: async () => [],
                            $disconnect: async () => {},
                        } as unknown as PrismaClient,
                    });
                    const headers = { authorization: testTelegramAuthorization() };
                    try {
                        for (const mode of ['scored', 'quiz'] as const) {
                            const body = {
                                title: 'Тест с результатом',
                                mode,
                                questions: [
                                    {
                                        id: 'q1',
                                        text: 'Вопрос?',
                                        correctOptionId: 'a2',
                                        options: [
                                            { id: 'a1', text: 'Нет', score: 0 },
                                            { id: 'a2', text: 'Да', score: 5 },
                                        ],
                                    },
                                ],
                                results: [
                                    {
                                        id: 'r1',
                                        title: 'Итог',
                                        description: 'Описание',
                                        minScore: 0,
                                        maxScore: mode === 'quiz' ? 1 : 5,
                                    },
                                ],
                            };
                            const save = await app.inject({
                                method: 'PUT',
                                url: `/api/tests/${id}`,
                                headers,
                                payload: body,
                            });
                            assert.equal(save.statusCode, 200);
                            const read = await app.inject({
                                method: 'GET',
                                url: `/api/tests/${id}`,
                                headers,
                            });
                            assert.equal(read.statusCode, 200);
                            assert.deepEqual(read.json(), { id, draft: body });
                            const stored = await transaction.personalTest.findUniqueOrThrow({
                                where: { id },
                            });
                            assert.deepEqual(stored.content, {
                                mode,
                                questions: body.questions,
                                results: body.results,
                            });
                            assert.equal(stored.subjectName, null);
                            assert.equal(
                                await transaction.personalTest.count({ where: { id } }),
                                1,
                            );
                        }
                    } finally {
                        await app.close();
                    }
                    throw rollback;
                },
                { timeout: 15000 },
            ),
            (error) => error === rollback,
        );
        assert.equal(await database.personalTest.count({ where: { id } }), 0);
    } finally {
        await database.$disconnect();
    }
});
