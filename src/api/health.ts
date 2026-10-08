export async function checkApiHealth(signal: AbortSignal): Promise<void> {
    const response = await fetch('/api/health', { signal, cache: 'no-store' });
    if (!response.ok) throw new Error('API недоступен');

    const payload: unknown = await response.json();
    if (
        typeof payload !== 'object' ||
        payload === null ||
        !('status' in payload) ||
        payload.status !== 'ok' ||
        !('service' in payload) ||
        payload.service !== 'testik-api'
    ) {
        throw new Error('Некорректный ответ API');
    }
}
