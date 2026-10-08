import { useEffect } from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Route, Routes, useLocation, useMatch } from 'react-router-dom';
import { useTelegram, useTelegramBackButton } from '../hooks';
import { BackNavigation, BrowserPreview } from '../components';
import {
    HomePage,
    TestDetailsPage,
    NotFoundPage,
    TestBuilderPage,
    TestPreviewPage,
    ReadyTestPreviewPage,
} from '../pages';
import './App.css';

export default function App() {
    const { appearance, isTelegram, platform, toggleAppearance, webApp } = useTelegram();
    const { pathname } = useLocation();
    const isHome = pathname === '/';
    const isPreview = Boolean(useMatch('/create/preview'));
    const readyPreview = useMatch('/tests/:id/preview');
    const backTo = isPreview ? '/create' : readyPreview ? `/tests/${readyPreview.params.id}` : '/';
    const backLabel = isPreview ? '← К редактору' : readyPreview ? '← К описанию' : '← Назад';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    useTelegramBackButton(webApp, isHome, backTo);

    return (
        <AppRoot
            appearance={appearance}
            platform={platform}
            className="theme-root"
            data-appearance={appearance}
        >
            <main className="app">
                {!isHome && <BackNavigation to={backTo} label={backLabel} />}
                <div className="screen-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/tests/:id" element={<TestDetailsPage />} />
                        <Route path="/tests/:id/preview" element={<ReadyTestPreviewPage />} />
                        <Route path="/create" element={<TestBuilderPage />}>
                            <Route path="preview" element={<TestPreviewPage />} />
                        </Route>
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
