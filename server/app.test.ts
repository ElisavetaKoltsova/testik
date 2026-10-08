import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';

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
