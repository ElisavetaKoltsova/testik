import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WebApp } from 'telegram-web-app';

export function useTelegramBackButton(webApp: WebApp | undefined, isHome: boolean, backTo: string) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!webApp || !webApp.isVersionAtLeast('6.1')) return;
        const goBack = () => navigate(backTo);
        if (isHome) webApp.BackButton.hide();
        else webApp.BackButton.show();
        webApp.BackButton.onClick(goBack);
        return () => {
            webApp.BackButton.offClick(goBack);
            webApp.BackButton.hide();
        };
    }, [webApp, isHome, backTo, navigate]);
}
