import { Button } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import './BackNavigation.css';

interface BackNavigationProps {
    to: string;
}

export function BackNavigation({ to }: BackNavigationProps) {
    const navigate = useNavigate();
    return (
        <nav className="back-nav" aria-label="Назад">
            <Button mode="plain" size="s" onClick={() => navigate(to)}>
                {to === '/create' ? '← К редактору' : '← Назад'}
            </Button>
        </nav>
    );
}
