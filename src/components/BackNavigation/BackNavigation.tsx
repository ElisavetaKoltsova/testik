import { Button } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import './BackNavigation.css';

export function BackNavigation() {
    const navigate = useNavigate();
    return (
        <nav className="back-nav" aria-label="Назад">
            <Button mode="plain" size="s" onClick={() => navigate('/')}>
                ← Назад
            </Button>
        </nav>
    );
}
