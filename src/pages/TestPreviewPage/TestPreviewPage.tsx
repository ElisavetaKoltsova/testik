import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { QuestionStep } from '../../components';
import { getDraftValidationError } from '../../data';
import type { CustomTestDraft } from '../../data';
import './TestPreviewPage.css';

export function TestPreviewPage() {
    const { draft } = useOutletContext<{ draft: CustomTestDraft }>();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const error = getDraftValidationError(draft);

    if (error)
        return (
            <Placeholder header="Заполни тест для предпросмотра" description={error}>
                <Button className="rounded-button" size="l" onClick={() => navigate('/create')}>
                    К редактированию
                </Button>
            </Placeholder>
        );

    if (step === draft.questions.length) {
        return (
            <Placeholder
                header="Предпросмотр завершён"
                description="Так друзья будут проходить твой тест. Это пробный просмотр, ответы не отправлены."
            >
                <span className="preview-finish-icon" aria-hidden="true">
                    🎉
                </span>
                <div className="preview-finish-actions">
                    <Button
                        className="rounded-button"
                        size="l"
                        stretched
                        onClick={() => navigate('/create')}
                    >
                        К редактированию
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
        );
    }

    const question = draft.questions[step];
    const goNext = () => {
        if (question.options.some((option) => option.id === answers[question.id]))
            setStep((current) => current + 1);
    };
    return (
        <QuestionStep
            title={draft.title}
            question={question}
            number={step + 1}
            total={draft.questions.length}
            selectedOptionId={answers[question.id]}
            onSelect={(optionId) =>
                setAnswers((current) => ({ ...current, [question.id]: optionId }))
            }
            onNext={goNext}
            onBack={() => (step > 0 ? setStep((current) => current - 1) : navigate('/create'))}
        />
    );
}
