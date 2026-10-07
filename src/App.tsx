import { useState } from 'react';
import { AppRoot, Button, Placeholder } from '@telegram-apps/telegram-ui';
import { useTelegram } from './useTelegram';

export default function App() {
  const [checked, setChecked] = useState(false);
  const { appearance, isTelegram, platform, toggleAppearance } = useTelegram();

  return (
    <AppRoot appearance={appearance} platform={platform} className="theme-root" data-appearance={appearance}>
      <main className="app">
        <Placeholder header="Тестик" description={checked
          ? 'Всё работает! Можно переходить к следующему шагу.'
          : 'Будущий Telegram Mini App с тестами о тебе. Основа проекта готова.'}>
          <span className="app-icon" aria-hidden="true">💬</span>
          <Button size="l" stretched onClick={() => setChecked(true)}>
            {checked ? 'React и Telegram UI работают' : 'Проверить кнопку'}
          </Button>
        </Placeholder>
        {!isTelegram && <aside className="browser-preview">
          <p>Предпросмотр в браузере</p>
          <Button className="theme-toggle" size="m" mode="outline" onClick={toggleAppearance}>
            {appearance === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
          </Button>
        </aside>}
      </main>
    </AppRoot>
  );
}

