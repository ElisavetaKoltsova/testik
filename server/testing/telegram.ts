import { createHmac } from 'node:crypto';

export const testBotToken = 'testik-persistence-tests-only';

export function testTelegramAuthorization(id = 42): string {
    const fields = {
        auth_date: String(Math.floor(Date.now() / 1000)),
        user: JSON.stringify({ id, first_name: 'Проверка' }),
    };
    const message = Object.entries(fields)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    const secret = createHmac('sha256', 'WebAppData').update(testBotToken).digest();
    const hash = createHmac('sha256', secret).update(message).digest('hex');
    return `tma ${new URLSearchParams({ ...fields, hash })}`;
}
