import type { CustomTestDraft } from '../data';

export async function saveCustomTest(
    id: string,
    draft: CustomTestDraft,
    signal: AbortSignal,
): Promise<void> {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData)
        throw new Error('Открой приложение через Telegram, чтобы сохранить тест в аккаунт.');
    const response = await fetch(`/api/tests/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `tma ${initData}` },
        body: JSON.stringify(draft),
        signal,
        cache: 'no-store',
    });
    if (response.status === 401) throw new Error('Открой приложение заново через Telegram.');
    if (response.status === 409) throw new Error('Этот тест недоступен для редактирования.');
    if (response.status === 400 || response.status === 413)
        throw new Error('Проверь вопросы, варианты и длину текстов.');
    if (!response.ok) throw new Error('Не удалось сохранить тест. Попробуй ещё раз.');
    const payload: unknown = await response.json();
    if (
        typeof payload !== 'object' ||
        payload === null ||
        !('id' in payload) ||
        payload.id !== id ||
        !('savedAt' in payload) ||
        typeof payload.savedAt !== 'string'
    ) {
        throw new Error('Не удалось подтвердить сохранение. Попробуй ещё раз.');
    }
}
