import { useEffect, useRef } from 'react';
import { Button, Radio } from '@telegram-apps/telegram-ui';
import type { DraftQuestion } from '../../data';
import './QuestionStep.css';

interface QuestionStepProps {
    title: string;
    question: DraftQuestion;
    number: number;
    total: number;
    selectedOptionId?: string;
    onSelect: (optionId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export function QuestionStep({
    title,
    question,
    number,
    total,
    selectedOptionId,
    onSelect,
    onNext,
    onBack,
}: QuestionStepProps) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        headingRef.current?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }, [question.id]);

    return (
        <section className="question-step">
            <p className="eyebrow">ПРЕДПРОСМОТР</p>
            <p className="preview-test-title">{title}</p>
            <div className="question-progress">
                <span>
                    Вопрос {number} из {total}
                </span>
                <progress aria-label="Прогресс теста" value={number} max={total} />
            </div>
            <h1 id="preview-question-title" ref={headingRef} tabIndex={-1}>
                {question.text}
            </h1>
            <p id="preview-answer-hint" className="preview-hint">
                Выбери один ответ
            </p>
            <fieldset
                className="answer-options"
                aria-labelledby="preview-question-title"
                aria-describedby="preview-answer-hint"
            >
                {question.options.map((option) => (
                    <div
                        key={option.id}
                        className={`answer-option${selectedOptionId === option.id ? ' answer-option--selected' : ''}`}
                    >
                        <Radio
                            id={`preview-option-${option.id}`}
                            className="answer-radio"
                            name={`question-${question.id}`}
                            value={option.id}
                            checked={selectedOptionId === option.id}
                            onChange={() => onSelect(option.id)}
                        />
                        <label
                            className="answer-option-text"
                            htmlFor={`preview-option-${option.id}`}
                        >
                            {option.text}
                        </label>
                    </div>
                ))}
            </fieldset>
            <div className="question-step-actions">
                <Button
                    className="rounded-button"
                    size="l"
                    mode="outline"
                    stretched
                    onClick={onBack}
                >
                    {number === 1 ? 'К редактору' : 'Назад'}
                </Button>
                <Button
                    className="rounded-button"
                    size="l"
                    stretched
                    disabled={!selectedOptionId}
                    onClick={onNext}
                >
                    {number === total ? 'Завершить просмотр' : 'Далее'}
                </Button>
            </div>
            <p className="preview-hint preview-disclaimer">
                Пробное прохождение: ответы не отправляются и не сохраняются.
            </p>
        </section>
    );
}
