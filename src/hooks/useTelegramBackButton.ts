import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WebApp } from 'telegram-web-app';

export function useTelegramBackButton(webApp: WebApp | undefined, isHome: boolean) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!webApp || !webApp.isVersionAtLeast('6.1')) return;
        const goHome = () => navigate('/');
        if (isHome) webApp.BackButton.hide();
        else webApp.BackButton.show();
        webApp.BackButton.onClick(goHome);
        return () => {
            webApp.BackButton.offClick(goHome);
            webApp.BackButton.hide();
        };
    }, [webApp, isHome, navigate]);
}
