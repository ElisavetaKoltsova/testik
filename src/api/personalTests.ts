import { isCustomTestDraft, normalizeCustomTestDraft } from '../data';
import type { CustomTestDraft } from '../data';

export interface PersonalTestSummary {
    id: string;
    title: string;
    updatedAt: string;
}

export interface PersonalTestList {
    tests: PersonalTestSummary[];
    hasNext: boolean;
}

export interface PersonalTestDraft {
    id: string;
    draft: CustomTestDraft;
}

function authorization() {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) throw new Error('Открой приложение через Telegram.');
    return { Authorization: `tma ${initData}` };
}

async function readTests(path: string, signal: AbortSignal): Promise<unknown> {
    const response = await fetch(path, { headers: authorization(), signal, cache: 'no-store' });
    if (response.status === 401) throw new Error('Открой приложение заново через Telegram.');
    if (response.status === 404)
        throw new Error('Тест не найден или недоступен для редактирования.');
    if (!response.ok) throw new Error('Не удалось загрузить тесты. Попробуй ещё раз.');
    return response.json();
}

export async function getPersonalTests(
    page: number,
    signal: AbortSignal,
): Promise<PersonalTestList> {
    const payload = await readTests(`/api/tests?page=${page}`, signal);
    if (
        typeof payload !== 'object' ||
        !payload ||
        !('tests' in payload) ||
        !Array.isArray(payload.tests) ||
        !('hasNext' in payload) ||
        typeof payload.hasNext !== 'boolean' ||
        !payload.tests.every(
            (test: unknown) =>
                typeof test === 'object' &&
                test !== null &&
                'id' in test &&
                typeof test.id === 'string' &&
                'title' in test &&
                typeof test.title === 'string' &&
                'updatedAt' in test &&
                typeof test.updatedAt === 'string' &&
                Number.isFinite(Date.parse(test.updatedAt)),
        )
    )
        throw new Error('Не удалось прочитать список тестов.');
    return payload as PersonalTestList;
}

export async function getPersonalTest(id: string, signal: AbortSignal): Promise<PersonalTestDraft> {
    const payload = await readTests(`/api/tests/${encodeURIComponent(id)}`, signal);
    if (
        typeof payload !== 'object' ||
        !payload ||
        !('id' in payload) ||
        payload.id !== id ||
        !('draft' in payload) ||
        !isCustomTestDraft(payload.draft)
    )
        throw new Error('Не удалось прочитать тест.');
    return { id, draft: normalizeCustomTestDraft(payload.draft) };
}

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
        throw new Error('Проверь вопросы, ответы, баллы и диапазоны результатов.');
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
