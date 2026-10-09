import { useEffect, useRef, useState } from 'react';
import { getCurrentUser, saveCustomTest } from '../api';
import type { CustomTestDraft } from '../data';

export function useServerTestSave(draft: CustomTestDraft) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
    const requestRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);
    const idsRef = useRef(new Map<string, string>());

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            requestRef.current?.abort();
        };
    }, []);

    const save = async () => {
        if (requestRef.current) return;
        const controller = new AbortController();
        requestRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        setSaving(true);
        setError(null);
        const snapshot = JSON.stringify(draft);
        try {
            const user = await getCurrentUser(controller.signal);
            const storageKey = `testik.custom-test-cloud-id.v1.${user.id}`;
            let id = idsRef.current.get(user.id);
            if (!id) {
                try {
                    id = localStorage.getItem(storageKey) ?? undefined;
                } catch {
                    /* ID остаётся в памяти, если хранилище недоступно. */
                }
                if (
                    !id ||
                    !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(id)
                )
                    id = crypto.randomUUID();
                id = id.toLowerCase();
                idsRef.current.set(user.id, id);
            }
            try {
                localStorage.setItem(storageKey, id);
            } catch {
                /* Следующая попытка в этой сессии использует тот же ID. */
            }
            await saveCustomTest(id, draft, controller.signal);
            if (mountedRef.current) setSavedSnapshot(snapshot);
        } catch (cause) {
            if (mountedRef.current)
                setError(
                    controller.signal.aborted
                        ? 'Сохранение заняло слишком много времени. Попробуй ещё раз.'
                        : cause instanceof TypeError
                          ? 'Не удалось связаться с сервером. Попробуй ещё раз.'
                          : cause instanceof SyntaxError
                            ? 'Не удалось подтвердить сохранение. Попробуй ещё раз.'
                            : cause instanceof Error
                              ? cause.message
                              : 'Не удалось сохранить тест. Попробуй ещё раз.',
                );
        } finally {
            window.clearTimeout(timeout);
            requestRef.current = null;
            if (mountedRef.current) setSaving(false);
        }
    };

    const message =
        error ??
        (savedSnapshot
            ? savedSnapshot === JSON.stringify(draft)
                ? 'Тест сохранён в аккаунте.'
                : 'Есть изменения после сохранения в аккаунт.'
            : null);
    return { saving, message, isError: Boolean(error), save };
}
