import { Button } from '@telegram-apps/telegram-ui';
import { useApiHealth } from '../../hooks';
import './ApiStatus.css';

export function ApiStatus() {
    const { status, retry } = useApiHealth();
    return (
        <div className="api-status">
            <p role="status">
                {status === 'checking'
                    ? 'Проверяем связь с API…'
                    : status === 'available'
                      ? 'API подключён'
                      : 'API недоступен — проверь запуск сервера'}
            </p>
            <Button size="s" mode="plain" disabled={status === 'checking'} onClick={retry}>
                Проверить связь
            </Button>
        </div>
    );
}
