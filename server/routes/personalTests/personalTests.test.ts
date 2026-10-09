import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { buildApp } from '../../app.js';
import { testBotToken, testTelegramAuthorization } from '../../testing/telegram.js';

const validBody = () => ({
    title: '  Свой тест  ',
    questions: [
        {
            id: 'q1',
            text: '  Вопрос?  ',
            options: [
                { id: 'a1', text: '  Да  ' },
                { id: 'a2', text: 'Нет' },
            ],
        },
    ],
});

test('Save endpoint validates input, takes owner only from Telegram and strips response data', async (context) => {
    const id = randomUUID();
    const upsert = context.mock.fn(async () => ({
        id,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
    }));
    const database = {
        personalTest: { upsert },
        $queryRaw: async () => [],
        $disconnect: async () => {},
    } as unknown as PrismaClient;
    const app = buildApp({ database, botToken: testBotToken });
    const headers = {
        authorization: testTelegramAuthorization(),
        'content-type': 'application/json',
    };
    try {
        const invalid: unknown[] = [
            null,
            [],
            {},
            { ...validBody(), ownerTelegramId: '999' },
            { ...validBody(), status: 'PUBLISHED' },
            { ...validBody(), title: ' ' },
            { ...validBody(), title: 'x'.repeat(201) },
            { ...validBody(), questions: [] },
            {
                ...validBody(),
                questions: Array.from({ length: 11 }, (_, index) => ({
                    id: `q${index}`,
                    text: 'Вопрос',
                    options: [
                        { id: `a${index}`, text: 'Да' },
                        { id: `b${index}`, text: 'Нет' },
                    ],
                })),
            },
            {
                ...validBody(),
                questions: [{ ...validBody().questions[0], text: 'x'.repeat(1001) }],
            },
            {
                ...validBody(),
                questions: [{ id: 'q1', text: '?', options: [{ id: 'a1', text: 'Да' }] }],
            },
            {
                ...validBody(),
                questions: [
                    {
                        id: 'q1',
                        text: '?',
                        options: Array.from({ length: 7 }, (_, i) => ({
                            id: `a${i}`,
                            text: 'Ответ',
                        })),
                    },
                ],
            },
            {
                ...validBody(),
                questions: [
                    {
                        id: 'q1',
                        text: '?',
                        options: [
                            { id: 'a1', text: 'Да' },
                            { id: 'a1', text: 'Нет' },
                        ],
                    },
                ],
            },
            {
                ...validBody(),
                questions: [
                    {
                        id: 'q1',
                        text: '?',
                        options: [
                            { id: 'q1', text: 'Да' },
                            { id: 'a2', text: 'Нет' },
                        ],
                    },
                ],
            },
            {
                ...validBody(),
                questions: [
                    {
                        id: 'q1',
                        text: '?',
                        options: [
                            { id: 'a1', text: ' ' },
                            { id: 'a2', text: 'Нет' },
                        ],
                    },
                ],
            },
            {
                ...validBody(),
                questions: [
                    {
                        id: 'q1',
                        text: '?',
                        options: [
                            { id: 'a1', text: 'x'.repeat(501) },
                            { id: 'a2', text: 'Нет' },
                        ],
                    },
                ],
            },
        ];
        for (const payload of invalid) {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/tests/${id}`,
                headers,
                payload: JSON.stringify(payload),
            });
            assert.equal(response.statusCode, 400);
        }
        assert.equal(upsert.mock.callCount(), 0);
        const anonymous = await app.inject({
            method: 'PUT',
            url: `/api/tests/${id}`,
            payload: validBody(),
        });
        assert.equal(anonymous.statusCode, 401);
        const invalidId = await app.inject({
            method: 'PUT',
            url: '/api/tests/not-a-uuid',
            headers,
            payload: validBody(),
        });
        assert.equal(invalidId.statusCode, 400);
        const tooLarge = await app.inject({
            method: 'PUT',
            url: `/api/tests/${id}`,
            headers,
            payload: JSON.stringify({ ...validBody(), title: 'x'.repeat(140000) }),
        });
        assert.equal(tooLarge.statusCode, 413);
        const response = await app.inject({
            method: 'PUT',
            url: `/api/tests/${id}`,
            headers,
            payload: validBody(),
        });
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.json(), { id, savedAt: '2026-01-01T00:00:00.000Z' });
        assert.equal(response.headers['cache-control'], 'no-store');
        const call = upsert.mock.calls[0].arguments[0] as unknown as {
            where: { ownerTelegramId: bigint; status: string; source: string };
            create: {
                ownerTelegramId: bigint;
                title: string;
                source: string;
                content: { questions: { text: string; options: { text: string }[] }[] };
            };
        };
        assert.equal(call.create.ownerTelegramId, 42n);
        assert.equal(call.where.ownerTelegramId, 42n);
        assert.equal(call.where.status, 'DRAFT');
        assert.equal(call.where.source, 'CUSTOM');
        assert.equal(call.create.title, 'Свой тест');
        assert.equal(call.create.content.questions[0].text, 'Вопрос?');
        assert.equal(call.create.content.questions[0].options[0].text, 'Да');
    } finally {
        await app.close();
    }
});

test('Save endpoint hides internal database failures', async () => {
    const database = {
        personalTest: {
            upsert: async () => {
                throw new Error('internal-database-details');
            },
        },
        $queryRaw: async () => [],
        $disconnect: async () => {},
    } as unknown as PrismaClient;
    const app = buildApp({ database, botToken: testBotToken });
    try {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/tests/${randomUUID()}`,
            headers: { authorization: testTelegramAuthorization() },
            payload: validBody(),
        });
        assert.equal(response.statusCode, 503);
        assert.equal(response.body.includes('internal-database-details'), false);
    } finally {
        await app.close();
    }
});
