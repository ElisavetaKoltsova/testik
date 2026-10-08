import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { QuestionStep } from '../QuestionStep';
import type { TestContent } from '../../data';
import './TestPreview.css';

interface TestPreviewProps {
    content: TestContent;
    returnTo: string;
    returnLabel: string;
    firstBackLabel: string;
    description?: string;
    renderResult?: (answers: Record<string, string>) => ReactNode;
}

export function TestPreview({
    content,
    returnTo,
    returnLabel,
    firstBackLabel,
    description,
    renderResult,
}: TestPreviewProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    if (step === content.questions.length) {
        return (
            <>
                {renderResult?.(answers)}
                <Placeholder
                    header={renderResult ? undefined : 'Предпросмотр завершён'}
                    description="Это пробный просмотр. Ответы не отправлены."
                >
                    {!renderResult && (
                        <span className="preview-finish-icon" aria-hidden="true">
                            🎉
                        </span>
                    )}
                    <div className="preview-finish-actions">
                        <Button
                            className="rounded-button"
                            size="l"
                            stretched
                            onClick={() => navigate(returnTo)}
                        >
                            {returnLabel}
                        </Button>
                        <Button
                            size="m"
                            mode="plain"
                            onClick={() => {
                                setAnswers({});
                                setStep(0);
                            }}
                        >
                            Посмотреть ещё раз
                        </Button>
                    </div>
                </Placeholder>
            </>
        );
    }
    const question = content.questions[step];
    const goNext = () => {
        if (question.options.some((option) => option.id === answers[question.id]))
            setStep((current) => current + 1);
    };
    return (
        <QuestionStep
            title={content.title}
            description={step === 0 ? description : undefined}
            question={question}
            number={step + 1}
            total={content.questions.length}
            selectedOptionId={answers[question.id]}
            firstBackLabel={firstBackLabel}
            onSelect={(optionId) =>
                setAnswers((current) => ({ ...current, [question.id]: optionId }))
            }
            onNext={goNext}
            onBack={() => (step > 0 ? setStep((current) => current - 1) : navigate(returnTo))}
        />
    );
}
