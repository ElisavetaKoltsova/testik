import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { getPersonalTests } from '../../api';
import { PersonalTestCard } from '../../components';
import { useTestQuery } from '../../hooks';
import './MyTestsPage.css';

export function MyTestsPage() {
    const [page, setPage] = useState(1);
    const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
    const load = useCallback((signal: AbortSignal) => getPersonalTests(page, signal), [page]);
    const { data, loading, error, reload } = useTestQuery(load, isTelegram);
    const navigate = useNavigate();
    const { state } = useLocation();
    return (
        <section className="my-tests">
            <header className="my-tests-header">
                <p className="eyebrow">ЛИЧНОЕ</p>
                <h1>Мои тесты</h1>
                <p>Сохранённые собственные тесты. Пока это черновики — друзья их ещё не видят.</p>
            </header>
            {state?.saved && (
                <p className="my-tests-success" role="status">
                    Тест сохранён в аккаунте.
                </p>
            )}
            <Button className="rounded-button" stretched onClick={() => navigate('/create')}>
                Создать новый тест
            </Button>
            {!isTelegram ? (
                <Placeholder
                    header="Открой через Telegram"
                    description="Здесь появятся тесты, сохранённые в твоём аккаунте."
                />
            ) : loading ? (
                <Placeholder header="Загружаем тесты…" aria-live="polite" />
            ) : error ? (
                <Placeholder header="Не удалось загрузить тесты" description={error}>
                    <Button className="rounded-button" onClick={reload}>
                        Попробовать ещё раз
                    </Button>
                </Placeholder>
            ) : (
                data && (
                    <>
                        {data.tests.length ? (
                            <div className="personal-tests-list">
                                {data.tests.map((test) => (
                                    <PersonalTestCard key={test.id} test={test} />
                                ))}
                            </div>
                        ) : (
                            <Placeholder
                                header="Здесь пока пусто"
                                description="Создай свой тест и сохрани его в аккаунт."
                            />
                        )}
                        {(page > 1 || data.hasNext) && (
                            <nav className="my-tests-pagination" aria-label="Страницы тестов">
                                <Button
                                    mode="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage((current) => current - 1)}
                                >
                                    Назад
                                </Button>
                                <span>Страница {page}</span>
                                <Button
                                    mode="outline"
                                    disabled={!data.hasNext}
                                    onClick={() => setPage((current) => current + 1)}
                                >
                                    Дальше
                                </Button>
                            </nav>
                        )}
                        <Button className="rounded-button" mode="plain" onClick={reload}>
                            Обновить список
                        </Button>
                    </>
                )
            )}
        </section>
    );
}
