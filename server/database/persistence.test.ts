import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { PrismaClient, Prisma } from '@prisma/client';
import { buildApp } from '../app.js';
import { createDatabaseClient } from './index.js';
import { testBotToken, testTelegramAuthorization } from '../testing/telegram.js';

const body = {
    title: 'Тест сохранения',
    questions: [
        {
            id: 'q1',
            text: 'Вопрос?',
            options: [
                { id: 'a1', text: 'Да' },
                { id: 'a2', text: 'Нет' },
            ],
        },
    ],
};

function appForTransaction(transaction: Prisma.TransactionClient) {
    const database = {
        personalTest: transaction.personalTest,
        $queryRaw: async () => [],
        $disconnect: async () => {},
    } as unknown as PrismaClient;
    return buildApp({ database, botToken: testBotToken });
}

test('Saving twice updates one owned draft in real PostgreSQL', async () => {
    const database = createDatabaseClient();
    const rollback = new Error('rollback-persistence-test');
    const id = randomUUID();
    try {
        await assert.rejects(
            database.$transaction(async (transaction) => {
                const app = appForTransaction(transaction);
                try {
                    const headers = { authorization: testTelegramAuthorization(42) };
                    const first = await app.inject({
                        method: 'PUT',
                        url: `/api/tests/${id}`,
                        headers,
                        payload: body,
                    });
                    assert.equal(first.statusCode, 200);
                    const second = await app.inject({
                        method: 'PUT',
                        url: `/api/tests/${id}`,
                        headers,
                        payload: { ...body, title: 'Обновлённый тест' },
                    });
                    assert.equal(second.statusCode, 200);
                    assert.equal(await transaction.personalTest.count({ where: { id } }), 1);
                    const saved = await transaction.personalTest.findUniqueOrThrow({
                        where: { id },
                    });
                    assert.equal(saved.ownerTelegramId, 42n);
                    assert.equal(saved.status, 'DRAFT');
                    assert.equal(saved.title, 'Обновлённый тест');
                    assert.deepEqual(saved.content, { questions: body.questions });
                    const detail = await app.inject({
                        method: 'GET',
                        url: `/api/tests/${id}`,
                        headers,
                    });
                    assert.equal(detail.statusCode, 200);
                    assert.deepEqual(detail.json(), {
                        id,
                        draft: { ...body, title: 'Обновлённый тест' },
                    });
                    const foreignDetail = await app.inject({
                        method: 'GET',
                        url: `/api/tests/${id}`,
                        headers: { authorization: testTelegramAuthorization(43) },
                    });
                    assert.equal(foreignDetail.statusCode, 404);
                } finally {
                    await app.close();
                }
                throw rollback;
            }),
            (error) => error === rollback,
        );
        assert.equal(await database.personalTest.count({ where: { id } }), 0);
    } finally {
        await database.$disconnect();
    }
});

for (const protection of ['foreign', 'published', 'ready'] as const) {
    test(`Saving cannot overwrite a ${protection} test in real PostgreSQL`, async () => {
        const database = createDatabaseClient();
        const rollback = new Error('rollback-access-test');
        const id = randomUUID();
        try {
            await assert.rejects(
                database.$transaction(async (transaction) => {
                    await transaction.personalTest.create({
                        data: {
                            id,
                            ownerTelegramId: protection === 'foreign' ? 43n : 42n,
                            title: 'Защищённый тест',
                            source: protection === 'ready' ? 'READY' : 'CUSTOM',
                            status: protection === 'published' ? 'PUBLISHED' : 'DRAFT',
                            content: { questions: body.questions },
                        },
                    });
                    const app = appForTransaction(transaction);
                    try {
                        const detail = await app.inject({
                            method: 'GET',
                            url: `/api/tests/${id}`,
                            headers: { authorization: testTelegramAuthorization(42) },
                        });
                        assert.equal(detail.statusCode, 404);
                        const response = await app.inject({
                            method: 'PUT',
                            url: `/api/tests/${id}`,
                            headers: { authorization: testTelegramAuthorization(42) },
                            payload: body,
                        });
                        assert.equal(response.statusCode, 409);
                    } finally {
                        await app.close();
                    }
                    throw rollback;
                }),
                (error) => error === rollback,
            );
            assert.equal(await database.personalTest.count({ where: { id } }), 0);
        } finally {
            await database.$disconnect();
        }
    });
}
