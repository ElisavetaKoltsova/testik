import { useNavigate } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';

export function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <Placeholder
            header="Тест не найден"
            description="Вернись на главную и выбери один из доступных тестов."
        >
            <Button className="rounded-button" size="l" onClick={() => navigate('/')}>
                На главную
            </Button>
        </Placeholder>
    );
}
