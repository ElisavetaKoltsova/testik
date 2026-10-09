import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import { buildApp } from '../app.js';
import { validateTelegramInitData } from './telegram.js';

const botToken = 'testik-auth-tests-only';

// Независимая генерация подписи через Web Crypto, без вызова кода проверяющего модуля.
async function sign(fields: Record<string, string>, token = botToken): Promise<string> {
    const encoder = new TextEncoder();
    const importKey = (bytes: Uint8Array | ArrayBuffer) =>
        webcrypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, [
            'sign',
        ]);
    const baseKey = await importKey(encoder.encode('WebAppData'));
    const secret = await webcrypto.subtle.sign('HMAC', baseKey, encoder.encode(token));
    const key = await importKey(secret);
    const message = Object.keys(fields)
        .sort()
        .map((name) => `${name}=${fields[name]}`)
        .join('\n');
    const hash = Buffer.from(
        await webcrypto.subtle.sign('HMAC', key, encoder.encode(message)),
    ).toString('hex');
    return new URLSearchParams({ ...fields, hash }).toString();
}

function fields(authDate = Math.floor(Date.now() / 1000)): Record<string, string> {
    return {
        query_id: 'query+with&symbols',
        auth_date: String(authDate),
        user: JSON.stringify({
            id: 4503599627370495,
            first_name: 'Аня & Маша + 💬',
            last_name: 'Тест',
            username: 'testik_test',
            photo_url: 'https://example.com/avatar.jpg',
        }),
        signature: 'signed-field-from-telegram',
    };
}

test('Telegram validation checks canonical signature, expiry boundaries and future timestamps', async () => {
    const now = 1700000000;
    const raw = await sign(fields(now));
    const user = validateTelegramInitData(raw, botToken, now);
    assert.deepEqual(user, {
        id: '4503599627370495',
        firstName: 'Аня & Маша + 💬',
        lastName: 'Тест',
        username: 'testik_test',
    });
    assert.equal(validateTelegramInitData(raw, 'different-test-token', now), null);
    assert.ok(validateTelegramInitData(await sign(fields(now - 3600)), botToken, now));
    assert.equal(validateTelegramInitData(await sign(fields(now - 3601)), botToken, now), null);
    assert.ok(validateTelegramInitData(await sign(fields(now + 30)), botToken, now));
    assert.equal(validateTelegramInitData(await sign(fields(now + 31)), botToken, now), null);
    assert.equal(validateTelegramInitData(`${raw}&auth_date=${now}`, botToken, now), null);
    assert.equal(validateTelegramInitData('x'.repeat(16385), botToken, now), null);
});

test('Current user route accepts only a verified identity and does not cache personal data', async () => {
    const app = buildApp({ botToken });
    try {
        const raw = await sign(fields());
        const response = await app.inject({
            url: '/api/me',
            headers: { authorization: `tma ${raw}` },
        });
        assert.equal(response.statusCode, 200);
        assert.equal(response.headers['cache-control'], 'no-store');
        assert.equal(response.headers.vary, 'Authorization');
        assert.deepEqual(response.json(), {
            user: {
                id: '4503599627370495',
                firstName: 'Аня & Маша + 💬',
                lastName: 'Тест',
                username: 'testik_test',
            },
        });
        assert.equal(JSON.stringify(response.json()).includes('photo_url'), false);

        const simple = await sign({
            auth_date: String(Math.floor(Date.now() / 1000)),
            user: JSON.stringify({ id: 42, first_name: 'Тест' }),
        });
        const simpleResponse = await app.inject({
            url: '/api/me',
            headers: { authorization: `tma ${simple}` },
        });
        assert.deepEqual(simpleResponse.json(), { user: { id: '42', firstName: 'Тест' } });
    } finally {
        await app.close();
    }
});

test('Current user route rejects forged, malformed, expired and ambiguous credentials', async () => {
    const app = buildApp({ botToken });
    try {
        const raw = await sign(fields());
        const tampered = new URLSearchParams(raw);
        tampered.set('user', JSON.stringify({ id: 1, first_name: 'Подмена' }));
        const invalidUsers = [
            'null',
            '[]',
            '{invalid',
            JSON.stringify({ id: '42', first_name: 'Тест' }),
            JSON.stringify({ id: 0, first_name: 'Тест' }),
            JSON.stringify({ id: 1.5, first_name: 'Тест' }),
            JSON.stringify({ id: 9007199254740992, first_name: 'Тест' }),
            JSON.stringify({ id: 42 }),
            JSON.stringify({ id: 42, first_name: 'Тест', username: 123 }),
        ];
        const headers = [
            undefined,
            'Bearer 42',
            'tma hash=abc',
            `tma ${tampered}`,
            `tma ${raw}&user=%7B%7D`,
            `tma ${raw}&hash=${'a'.repeat(64)}`,
            `tma ${await sign(fields(), 'different-test-token')}`,
            `tma ${await sign(fields(Math.floor(Date.now() / 1000) - 3601))}`,
            `tma ${await sign(fields(Math.floor(Date.now() / 1000) + 300))}`,
            `tma ${await sign({ ...fields(), auth_date: 'not-a-date' })}`,
            ...(await Promise.all(
                invalidUsers.map(async (user) => `tma ${await sign({ ...fields(), user })}`),
            )),
        ];
        for (const authorization of headers) {
            const response = await app.inject({
                url: '/api/me',
                headers: authorization ? { authorization } : {},
            });
            assert.equal(response.statusCode, 401);
            assert.equal(response.headers['cache-control'], 'no-store');
            assert.equal('user' in response.json(), false);
        }
        const query = await app.inject({ url: `/api/me?initData=${encodeURIComponent(raw)}` });
        assert.equal(query.statusCode, 401);
        assert.equal((await app.inject({ url: '/api/health' })).statusCode, 200);
    } finally {
        await app.close();
    }
});

test('Missing bot configuration fails closed without affecting public health endpoint', async () => {
    const app = buildApp();
    try {
        const response = await app.inject({
            url: '/api/me',
            headers: { authorization: `tma ${await sign(fields())}` },
        });
        assert.equal(response.statusCode, 503);
        assert.equal('user' in response.json(), false);
        assert.equal((await app.inject({ url: '/api/health' })).statusCode, 200);
    } finally {
        await app.close();
    }
});
