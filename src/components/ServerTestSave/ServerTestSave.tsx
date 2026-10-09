import { Button } from '@telegram-apps/telegram-ui';
import './ServerTestSave.css';

interface ServerTestSaveProps {
    saving: boolean;
    message: string | null;
    isError: boolean;
    onSave: () => void;
}

export function ServerTestSave({ saving, message, isError, onSave }: ServerTestSaveProps) {
    const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
    return (
        <div className="server-test-save">
            <Button
                className="rounded-button"
                size="l"
                type="button"
                stretched
                disabled={!isTelegram || saving}
                onClick={onSave}
            >
                {saving ? 'Сохраняем…' : 'Сохранить в аккаунт'}
            </Button>
            <p className="builder-hint">
                {isTelegram
                    ? 'Сохраняется личный черновик. Он ещё не опубликован. Копия останется и на этом устройстве.'
                    : 'Сохранение в аккаунт доступно при открытии через Telegram.'}
            </p>
            {message && (
                <p
                    className={`builder-feedback builder-feedback--${isError ? 'error' : 'saved'}`}
                    role={isError ? 'alert' : 'status'}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
