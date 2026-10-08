import { Button } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import './BackNavigation.css';

interface BackNavigationProps {
    to: string;
    label: string;
}

export function BackNavigation({ to, label }: BackNavigationProps) {
    const navigate = useNavigate();
    return (
        <nav className="back-nav" aria-label="Назад">
            <Button mode="plain" size="s" onClick={() => navigate(to)}>
                {label}
            </Button>
        </nav>
    );
}
