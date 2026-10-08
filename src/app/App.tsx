import { useEffect } from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTelegram, useTelegramBackButton } from '../hooks';
import { BackNavigation, BrowserPreview } from '../components';
import { HomePage, TestDetailsPage, NotFoundPage, TestBuilderPage } from '../pages';
import './App.css';

export default function App() {
    const { appearance, isTelegram, platform, toggleAppearance, webApp } = useTelegram();
    const { pathname } = useLocation();
    const isHome = pathname === '/';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    useTelegramBackButton(webApp, isHome);

    return (
        <AppRoot
            appearance={appearance}
            platform={platform}
            className="theme-root"
            data-appearance={appearance}
        >
            <main className="app">
                {!isHome && <BackNavigation />}
                <div className="screen-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/tests/:id" element={<TestDetailsPage />} />
                        <Route path="/create" element={<TestBuilderPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </div>
                {!isTelegram && (
                    <BrowserPreview appearance={appearance} onToggleAppearance={toggleAppearance} />
                )}
            </main>
        </AppRoot>
    );
}
