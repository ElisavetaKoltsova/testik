import { useEffect, useRef, useState } from 'react';
import { getCurrentUser, saveCustomTest } from '../api';
import type { CustomTestDraft } from '../data';

export function useServerTestSave(draft: CustomTestDraft, id: string) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<{ id: string; text: string } | null>(null);
    const [savedSnapshot, setSavedSnapshot] = useState<{ id: string; value: string } | null>(null);
    const requestRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            requestRef.current?.abort();
        };
    }, []);

    const save = async () => {
        if (requestRef.current) return false;
        const controller = new AbortController();
        requestRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        setSaving(true);
        setError(null);
        const snapshot = JSON.stringify(draft);
        try {
            await getCurrentUser(controller.signal);
            await saveCustomTest(id, draft, controller.signal);
            if (mountedRef.current) setSavedSnapshot({ id, value: snapshot });
            return mountedRef.current;
        } catch (cause) {
            if (mountedRef.current)
                setError({
                    id,
                    text: controller.signal.aborted
                        ? 'Сохранение заняло слишком много времени. Попробуй ещё раз.'
                        : cause instanceof TypeError
                          ? 'Не удалось связаться с сервером. Попробуй ещё раз.'
                          : cause instanceof SyntaxError
                            ? 'Не удалось подтвердить сохранение. Попробуй ещё раз.'
                            : cause instanceof Error
                              ? cause.message
                              : 'Не удалось сохранить тест. Попробуй ещё раз.',
                });
            return false;
        } finally {
            window.clearTimeout(timeout);
            requestRef.current = null;
            if (mountedRef.current) setSaving(false);
        }
    };

    const message =
        (error?.id === id ? error.text : null) ??
        (savedSnapshot?.id === id
            ? savedSnapshot.value === JSON.stringify(draft)
                ? 'Тест сохранён в аккаунте.'
                : 'Есть изменения после сохранения в аккаунт.'
            : null);
    return { saving, message, isError: error?.id === id, save };
}
