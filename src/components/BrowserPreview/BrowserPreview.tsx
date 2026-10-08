import { Button } from '@telegram-apps/telegram-ui';
import { ApiStatus } from '../ApiStatus';
import './BrowserPreview.css';

interface BrowserPreviewProps {
    appearance: 'light' | 'dark';
    onToggleAppearance: () => void;
}

export function BrowserPreview({ appearance, onToggleAppearance }: BrowserPreviewProps) {
    return (
        <aside className="browser-preview">
            <p>Предпросмотр в браузере</p>
            <Button className="theme-toggle" size="m" mode="outline" onClick={onToggleAppearance}>
                {appearance === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
            </Button>
            <ApiStatus />
        </aside>
    );
}
