import { Button } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import type { PersonalTestSummary } from '../../api';
import './PersonalTestCard.css';

export function PersonalTestCard({ test }: { test: PersonalTestSummary }) {
    const navigate = useNavigate();
    return (
        <article className="personal-test-card">
            <p className="personal-test-status">Черновик</p>
            <h2>{test.title}</h2>
            <p className="personal-test-date">
                Сохранён{' '}
                {new Date(test.updatedAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </p>
            <Button
                className="rounded-button"
                size="m"
                stretched
                mode="outline"
                onClick={() => navigate(`/my-tests/${test.id}/edit`)}
            >
                Открыть тест
            </Button>
        </article>
    );
}
