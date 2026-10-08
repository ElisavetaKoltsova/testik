import { useEffect, useState } from 'react';
import type { WebApp } from 'telegram-web-app';

type Appearance = 'light' | 'dark';
const webApp: WebApp | undefined = window.Telegram?.WebApp;
// Это определение среды запуска; авторизация потребует проверки initData на сервере.
const isTelegram = Boolean(webApp?.initData);

export function useTelegram() {
    const [appearance, setAppearance] = useState<Appearance>(() =>
        isTelegram && webApp
            ? webApp.colorScheme
            : window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light',
    );

    useEffect(() => {
        if (!isTelegram || !webApp) return;
        const syncTheme = () => setAppearance(webApp.colorScheme);
        syncTheme();
        webApp.ready();
        webApp.expand();
        webApp.onEvent('themeChanged', syncTheme);
        return () => webApp.offEvent('themeChanged', syncTheme);
    }, []);

    const toggleAppearance = () => {
        if (!isTelegram) setAppearance((current) => (current === 'light' ? 'dark' : 'light'));
    };

    return {
        appearance,
        isTelegram,
        webApp: isTelegram ? webApp : undefined,
        platform: isTelegram && webApp?.platform === 'ios' ? ('ios' as const) : ('base' as const),
        toggleAppearance,
    };
}
