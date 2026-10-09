import { Select } from '@telegram-apps/telegram-ui';
import './OptionScoreSelect.css';

export function OptionScoreSelect({
    value,
    label,
    onChange,
}: {
    value: number;
    label: string;
    onChange: (score: number) => void;
}) {
    return (
        <Select
            className="option-score-select"
            aria-label={label}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
        >
            {[0, 1, 2, 3, 4, 5].map((score) => (
                <option key={score} value={score}>
                    {score}
                </option>
            ))}
        </Select>
    );
}
