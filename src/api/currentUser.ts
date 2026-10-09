export interface CurrentUser {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) throw new Error('Открой приложение через Telegram.');

    const response = await fetch('/api/me', {
        headers: { Authorization: `tma ${initData}` },
        signal,
        cache: 'no-store',
    });
    if (response.status === 401) throw new Error('Открой приложение заново через Telegram.');
    if (!response.ok) throw new Error('Вход через Telegram пока недоступен.');

    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null || !('user' in payload)) {
        throw new Error('Не удалось подтвердить вход.');
    }
    const user = payload.user;
    if (
        typeof user !== 'object' ||
        user === null ||
        !('id' in user) ||
        typeof user.id !== 'string' ||
        !/^[1-9]\d*$/.test(user.id) ||
        !('firstName' in user) ||
        typeof user.firstName !== 'string' ||
        ('lastName' in user && typeof user.lastName !== 'string') ||
        ('username' in user && typeof user.username !== 'string')
    ) {
        throw new Error('Не удалось подтвердить вход.');
    }
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: 'lastName' in user ? (user.lastName as string) : undefined,
        username: 'username' in user ? (user.username as string) : undefined,
    };
}
