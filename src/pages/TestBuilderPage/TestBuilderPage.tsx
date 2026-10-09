import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { getPersonalTest } from '../../api';
import { TestEditor } from '../../components';
import { useTestQuery } from '../../hooks';

function SavedTestEditor({ id }: { id: string }) {
    const load = useCallback((signal: AbortSignal) => getPersonalTest(id, signal), [id]);
    const { data, loading, error, reload } = useTestQuery(load);
    if (loading) return <Placeholder header="Загружаем тест…" aria-live="polite" />;
    if (error || !data)
        return (
            <Placeholder header="Не удалось открыть тест" description={error ?? undefined}>
                <Button className="rounded-button" onClick={reload}>
                    Попробовать ещё раз
                </Button>
            </Placeholder>
        );
    return <TestEditor initial={data} />;
}

export function TestBuilderPage() {
    const { id } = useParams();
    return id ? <SavedTestEditor key={id} id={id} /> : <TestEditor key="new" />;
}
