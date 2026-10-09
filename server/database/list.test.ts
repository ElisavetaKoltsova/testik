import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { buildApp } from '../app.js';
import { createDatabaseClient } from './index.js';
import { testBotToken, testTelegramAuthorization } from '../testing/telegram.js';

test('List and detail only expose owned custom drafts and paginate consistently', async () => {
    const database = createDatabaseClient();
    const rollback = new Error('rollback-list-test');
    const owner = Number(BigInt('0x' + randomUUID().replaceAll('-', '').slice(0, 11)));
    const ids = Array.from({ length: 25 }, () => randomUUID());
    try {
        await assert.rejects(
            database.$transaction(
                async (transaction) => {
                    const content = {
                        questions: [
                            {
                                id: 'q',
                                text: 'Вопрос?',
                                options: [
                                    { id: 'a', text: 'Да' },
                                    { id: 'b', text: 'Нет' },
                                ],
                            },
                        ],
                    };
                    await transaction.personalTest.createMany({
                        data: ids.map((id, index) => ({
                            id,
                            ownerTelegramId: BigInt(index === 21 ? owner + 1 : owner),
                            title: `Тест ${index}`,
                            content,
                            source: index === 22 ? ('READY' as const) : ('CUSTOM' as const),
                            status:
                                index === 23
                                    ? ('PUBLISHED' as const)
                                    : index === 24
                                      ? ('ARCHIVED' as const)
                                      : ('DRAFT' as const),
                            updatedAt: new Date(2026, 0, 1, 0, index),
                        })),
                    });
                    const app = buildApp({
                        botToken: testBotToken,
                        database: {
                            personalTest: transaction.personalTest,
                            $queryRaw: async () => [],
                            $disconnect: async () => {},
                        } as unknown as PrismaClient,
                    });
                    const headers = { authorization: testTelegramAuthorization(owner) };
                    try {
                        const first = await app.inject({
                            method: 'GET',
                            url: '/api/tests',
                            headers,
                        });
                        const second = await app.inject({
                            method: 'GET',
                            url: '/api/tests?page=2',
                            headers,
                        });
                        assert.equal(first.statusCode, 200);
                        assert.equal(first.headers['cache-control'], 'no-store');
                        const items = first.json();
                        assert.equal(items.tests.length, 20);
                        assert.equal(items.hasNext, true);
                        assert.deepEqual(
                            items.tests.map((item: { id: string }) => item.id),
                            ids.slice(1, 21).reverse(),
                        );
                        assert.deepEqual(Object.keys(items.tests[0]).sort(), [
                            'id',
                            'title',
                            'updatedAt',
                        ]);
                        assert.deepEqual(
                            second.json().tests.map((item: { id: string }) => item.id),
                            [ids[0]],
                        );
                        assert.equal(second.json().hasNext, false);
                        for (const id of ids.slice(21)) {
                            const response = await app.inject({
                                method: 'GET',
                                url: `/api/tests/${id}`,
                                headers,
                            });
                            assert.equal(response.statusCode, 404);
                        }
                        for (const url of ['/api/tests', `/api/tests/${ids[0]}`]) {
                            assert.equal(
                                (await app.inject({ method: 'GET', url })).statusCode,
                                401,
                            );
                        }
                        for (const page of ['0', '-1', '1.5', 'abc', '10000']) {
                            assert.equal(
                                (
                                    await app.inject({
                                        method: 'GET',
                                        url: `/api/tests?page=${page}`,
                                        headers,
                                    })
                                ).statusCode,
                                400,
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
        assert.equal(await database.personalTest.count({ where: { id: { in: ids } } }), 0);
    } finally {
        await database.$disconnect();
    }
});
