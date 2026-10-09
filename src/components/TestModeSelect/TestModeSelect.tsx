import { Select } from '@telegram-apps/telegram-ui';
import type { CustomTestMode } from '../../data';
import './TestModeSelect.css';

export function TestModeSelect({
    mode,
    onChange,
}: {
    mode: CustomTestMode;
    onChange: (mode: CustomTestMode) => void;
}) {
    return (
        <div className="test-mode-select">
            <label htmlFor="test-mode">Тип теста</label>
            <Select
                id="test-mode"
                value={mode}
                onChange={(event) => onChange(event.target.value as CustomTestMode)}
            >
                <option value="quiz">Проверка знаний</option>
                <option value="scored">Балльный тест</option>
            </Select>
            <p>
                {mode === 'quiz'
                    ? 'Отметь один правильный ответ в каждом вопросе. За него начисляется 1 балл.'
                    : 'Назначь каждому варианту от 0 до 5 баллов. Итог — сумма баллов выбранных ответов.'}
            </p>
        </div>
    );
}
