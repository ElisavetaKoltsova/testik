import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TelegramUser {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
}

const MAX_INIT_DATA_BYTES = 16_384;
const MAX_AGE_SECONDS = 3600;
const FUTURE_TOLERANCE_SECONDS = 30;

// Алгоритм Telegram: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateTelegramInitData(
    initData: string,
    botToken: string,
    nowSeconds = Math.floor(Date.now() / 1000),
): TelegramUser | null {
    if (!initData || !botToken || Buffer.byteLength(initData, 'utf8') > MAX_INIT_DATA_BYTES) {
        return null;
    }

    const parameters = new URLSearchParams(initData);
    const keys = new Set<string>();
    for (const key of parameters.keys()) {
        if (keys.has(key)) return null;
        keys.add(key);
    }

    const hash = parameters.get('hash');
    if (!hash || !/^[a-f\d]{64}$/i.test(hash)) return null;
    parameters.delete('hash');
    parameters.sort();
    const dataCheckString = [...parameters].map(([key, value]) => `${key}=${value}`).join('\n');
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest();
    if (!timingSafeEqual(expectedHash, Buffer.from(hash, 'hex'))) return null;

    const authDate = parameters.get('auth_date');
    if (!authDate || !/^\d+$/.test(authDate)) return null;
    const timestamp = Number(authDate);
    const age = nowSeconds - timestamp;
    if (
        !Number.isSafeInteger(timestamp) ||
        timestamp <= 0 ||
        age > MAX_AGE_SECONDS ||
        age < -FUTURE_TOLERANCE_SECONDS
    ) {
        return null;
    }

    let user: unknown;
    try {
        user = JSON.parse(parameters.get('user') ?? 'null');
    } catch {
        return null;
    }
    if (
        typeof user !== 'object' ||
        user === null ||
        !('id' in user) ||
        typeof user.id !== 'number' ||
        !Number.isSafeInteger(user.id) ||
        user.id <= 0 ||
        !('first_name' in user) ||
        typeof user.first_name !== 'string'
    ) {
        return null;
    }
    const lastName = 'last_name' in user ? user.last_name : undefined;
    const username = 'username' in user ? user.username : undefined;
    if (
        (lastName !== undefined && typeof lastName !== 'string') ||
        (username !== undefined && typeof username !== 'string')
    ) {
        return null;
    }
    return { id: String(user.id), firstName: user.first_name, lastName, username };
}
