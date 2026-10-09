import { useEffect, useState } from 'react';

export function useTestQuery<T>(load: (signal: AbortSignal) => Promise<T>, enabled = true) {
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
        data: null,
        loading: enabled,
        error: null,
    });
    useEffect(() => {
        if (!enabled) return;
        let active = true;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        setState({ data: null, loading: true, error: null });
        load(controller.signal)
            .then(
                (data) => {
                    if (active) setState({ data, loading: false, error: null });
                },
                (cause: unknown) => {
                    if (active)
                        setState({
                            data: null,
                            loading: false,
                            error: controller.signal.aborted
                                ? 'Сервер не ответил вовремя. Попробуй ещё раз.'
                                : cause instanceof TypeError
                                  ? 'Не удалось связаться с сервером.'
                                  : cause instanceof SyntaxError
                                    ? 'Не удалось прочитать ответ сервера.'
                                    : cause instanceof Error
                                      ? cause.message
                                      : 'Не удалось загрузить тесты.',
                        });
                },
            )
            .finally(() => window.clearTimeout(timeout));
        return () => {
            active = false;
            controller.abort();
            window.clearTimeout(timeout);
        };
    }, [load, enabled, attempt]);
    return { ...state, reload: () => setAttempt((current) => current + 1) };
}
