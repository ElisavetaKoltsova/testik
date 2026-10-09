import { Button, Input, Radio, Textarea } from '@telegram-apps/telegram-ui';
import type { CustomTestMode, DraftQuestion } from '../../data';
import { OptionScoreSelect } from '../OptionScoreSelect';
import { CUSTOM_TEST_LIMITS } from '../../config';
import './QuestionEditor.css';

interface QuestionEditorProps {
    question: DraftQuestion;
    number: number;
    canRemove: boolean;
    mode: CustomTestMode;
    onCorrectOptionChange: (optionId: string) => void;
    onScoreChange: (optionId: string, score: number) => void;
    onTextChange: (text: string) => void;
    onOptionChange: (optionId: string, text: string) => void;
    onAddOption: () => void;
    onRemoveOption: (optionId: string) => void;
    onRemove: () => void;
}

export function QuestionEditor({
    question,
    number,
    canRemove,
    mode,
    onCorrectOptionChange,
    onScoreChange,
    onTextChange,
    onOptionChange,
    onAddOption,
    onRemoveOption,
    onRemove,
}: QuestionEditorProps) {
    const headingId = `question-heading-${question.id}`;
    const inputId = `question-input-${question.id}`;
    return (
        <section className="question-editor" aria-labelledby={headingId}>
            <div className="question-editor-header">
                <h2 id={headingId}>Вопрос {number}</h2>
                <Button
                    className="remove-question"
                    mode="plain"
                    size="s"
                    disabled={!canRemove}
                    onClick={onRemove}
                    aria-label={`Удалить вопрос ${number}`}
                >
                    Удалить
                </Button>
            </div>
            <div className="editor-field">
                <label htmlFor={inputId}>Текст вопроса</label>
                <Textarea
                    id={inputId}
                    rows={2}
                    maxLength={1000}
                    value={question.text}
                    placeholder="Например: какая планета ближе всего к Солнцу?"
                    onChange={(event) => onTextChange(event.target.value)}
                />
            </div>
            <p className="options-label">
                Варианты ответа · {question.options.length} из {CUSTOM_TEST_LIMITS.maxOptions}
            </p>
            <div className="editor-options">
                {question.options.map((option, index) => (
                    <div className="editor-option" key={option.id}>
                        <Input
                            className="option-input"
                            value={option.text}
                            maxLength={500}
                            placeholder={`Вариант ${index + 1}`}
                            aria-label={`Вопрос ${number}, вариант ${index + 1}`}
                            onChange={(event) => onOptionChange(option.id, event.target.value)}
                        />
                        {mode === 'quiz' ? (
                            <div className="correct-option-choice">
                                <Radio
                                    id={`correct-option-${option.id}`}
                                    name={`correct-${question.id}`}
                                    value={option.id}
                                    checked={question.correctOptionId === option.id}
                                    aria-label={`Правильный ответ: вопрос ${number}, вариант ${index + 1}`}
                                    onChange={() => onCorrectOptionChange(option.id)}
                                />
                                <label htmlFor={`correct-option-${option.id}`}>Верный</label>
                            </div>
                        ) : (
                            <OptionScoreSelect
                                value={option.score ?? 0}
                                label={`Баллы: вопрос ${number}, вариант ${index + 1}`}
                                onChange={(score) => onScoreChange(option.id, score)}
                            />
                        )}
                        <Button
                            className="remove-option"
                            size="s"
                            mode="plain"
                            disabled={question.options.length <= CUSTOM_TEST_LIMITS.minOptions}
                            aria-label={`Удалить вариант ${index + 1} вопроса ${number}`}
                            onClick={() => onRemoveOption(option.id)}
                        >
                            ×
                        </Button>
                    </div>
                ))}
            </div>
            <Button
                className="add-option"
                size="s"
                mode="plain"
                disabled={question.options.length >= CUSTOM_TEST_LIMITS.maxOptions}
                onClick={onAddOption}
            >
                + Добавить вариант
            </Button>
        </section>
    );
}
