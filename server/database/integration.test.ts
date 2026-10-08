import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Prisma } from '@prisma/client';
import { createDatabaseClient } from './index.js';

test('PostgreSQL stores JSONB snapshots, defaults and Telegram IDs without precision loss', async () => {
    const database = createDatabaseClient();
    const rollback = new Error('Rollback integration check');
    const ownerTelegramId = 9007199254740993n;
    const content = {
        questions: [{ id: 'q1', text: 'Вопрос', options: [{ id: 'a1', text: 'Ответ' }] }],
        resultType: 'maxScore',
        results: [{ id: 'warm', title: 'Тёплый человек' }],
    };

    try {
        await assert.rejects(
            database.$transaction(async (transaction) => {
                const custom = await transaction.personalTest.create({
                    data: {
                        ownerTelegramId,
                        title: 'Проверка черновика',
                        source: 'CUSTOM',
                        content,
                    },
                });
                assert.equal(custom.status, 'DRAFT');
                assert.equal(custom.version, 1);
                assert.equal(custom.subjectName, null);
                assert.equal(custom.ownerTelegramId, ownerTelegramId);
                assert.match(custom.shareCode, /^[\da-f-]{36}$/i);

                const ready = await transaction.personalTest.create({
                    data: {
                        ownerTelegramId,
                        title: 'Проверка готового теста',
                        subjectName: 'Аня',
                        source: 'READY',
                        readyTestId: 'person',
                        readyTestVersion: 1,
                        content,
                    },
                });
                const restored = await transaction.personalTest.findUniqueOrThrow({
                    where: { id: ready.id },
                });
                assert.deepEqual(restored.content, content);
                assert.equal(restored.subjectName, 'Аня');
                assert.equal(restored.readyTestVersion, 1);
                assert.notEqual(restored.shareCode, custom.shareCode);
                throw rollback;
            }),
            (error: unknown) => error === rollback,
        );
    } finally {
        await database.$disconnect();
    }
});

test('PostgreSQL rejects duplicate share codes and rolls back both test records', async () => {
    const database = createDatabaseClient();
    const shareCode = randomUUID();
    const data = {
        ownerTelegramId: 9007199254740993n,
        title: 'Проверка уникальной ссылки',
        source: 'CUSTOM' as const,
        shareCode,
        content: { questions: [] },
    };

    try {
        await assert.rejects(
            database.$transaction(async (transaction) => {
                await transaction.personalTest.create({ data });
                await transaction.personalTest.create({ data });
            }),
            (error: unknown) =>
                error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002',
        );
        assert.equal(await database.personalTest.count({ where: { shareCode } }), 0);
    } finally {
        await database.$disconnect();
    }
});
