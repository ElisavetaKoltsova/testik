import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';
import type { PrismaClient } from '@prisma/client';

test('API health endpoint returns JSON and unknown routes return 404', async () => {
    const app = buildApp();
    try {
        const health = await app.inject({ method: 'GET', url: '/api/health' });
        assert.equal(health.statusCode, 200);
        assert.match(health.headers['content-type'] ?? '', /application\/json/);
        assert.deepEqual(health.json(), { status: 'ok', service: 'testik-api' });

        const missing = await app.inject({ method: 'GET', url: '/api/missing' });
        assert.equal(missing.statusCode, 404);

        const wrongMethod = await app.inject({ method: 'POST', url: '/api/health' });
        assert.equal(wrongMethod.statusCode, 404);
    } finally {
        await app.close();
    }
});

test('API checks the database on startup and disconnects on shutdown', async (context) => {
    const query = context.mock.fn(async () => [{ value: 1 }]);
    const disconnect = context.mock.fn(async () => {});
    const database = { $queryRaw: query, $disconnect: disconnect } as unknown as PrismaClient;
    const app = buildApp({ database });

    try {
        const response = await app.inject({ method: 'GET', url: '/api/health' });
        assert.equal(response.statusCode, 200);
        assert.equal(query.mock.callCount(), 1);
    } finally {
        await app.close();
    }
    assert.equal(disconnect.mock.callCount(), 1);
});

test('API fails startup when the database is unavailable', async (context) => {
    const query = context.mock.fn(async () => {
        throw new Error('Database unavailable');
    });
    const disconnect = context.mock.fn(async () => {});
    const database = { $queryRaw: query, $disconnect: disconnect } as unknown as PrismaClient;
    const app = buildApp({ database });

    try {
        await assert.rejects(app.ready(), /Database unavailable/);
    } finally {
        await app.close();
    }
    assert.equal(disconnect.mock.callCount(), 1);
});
