import type { FormEvent } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { QuestionEditor } from '../../components';
import { CUSTOM_TEST_LIMITS } from '../../config';
import { useTestBuilder } from '../../hooks';
import './TestBuilderPage.css';

export function TestBuilderPage() {
    const {
        draft,
        feedback,
        setTitle,
        addQuestion,
        removeQuestion,
        setQuestionText,
        setOptionText,
        addOption,
        removeOption,
        saveDraft,
        validateForPreview,
    } = useTestBuilder();
    const navigate = useNavigate();
    const isPreview = useMatch('/create/preview');
    const handlePreview = () => {
        if (validateForPreview()) navigate('/create/preview');
    };
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        saveDraft();
    };
    if (isPreview) return <Outlet context={{ draft }} />;

    return (
        <>
            <header className="builder-header">
                <p className="eyebrow">КОНСТРУКТОР</p>
                <h1>Свой тест</h1>
                <p>Придумай вопросы, на которые интересно услышать ответы друзей.</p>
            </header>
            <form className="test-builder" onSubmit={handleSubmit}>
                <div className="builder-title-field">
                    <label htmlFor="test-title">Название теста</label>
                    <Input
                        id="test-title"
                        value={draft.title}
                        placeholder="Например: насколько хорошо ты меня знаешь?"
                        onChange={(event) => setTitle(event.target.value)}
                    />
                </div>
                <div className="builder-questions-header">
                    <h2>Вопросы</h2>
                    <span>
                        {draft.questions.length} из {CUSTOM_TEST_LIMITS.maxQuestions}
                    </span>
                </div>
                <p className="builder-hint">
                    В каждом — от {CUSTOM_TEST_LIMITS.minOptions} до {CUSTOM_TEST_LIMITS.maxOptions}{' '}
                    вариантов. При прохождении выбирается один ответ.
                </p>
                <div className="builder-questions">
                    {draft.questions.map((question, index) => (
                        <QuestionEditor
                            key={question.id}
                            question={question}
                            number={index + 1}
                            canRemove={draft.questions.length > 1}
                            onTextChange={(text) => setQuestionText(question.id, text)}
                            onOptionChange={(optionId, text) =>
                                setOptionText(question.id, optionId, text)
                            }
                            onAddOption={() => addOption(question.id)}
                            onRemoveOption={(optionId) => removeOption(question.id, optionId)}
                            onRemove={() => removeQuestion(question.id)}
                        />
                    ))}
                </div>
                <Button
                    className="rounded-button"
                    size="l"
                    mode="outline"
                    stretched
                    disabled={draft.questions.length >= CUSTOM_TEST_LIMITS.maxQuestions}
                    onClick={addQuestion}
                >
                    + Добавить вопрос
                </Button>
                <div className="builder-save">
                    <Button
                        className="rounded-button"
                        size="l"
                        mode="outline"
                        stretched
                        onClick={handlePreview}
                    >
                        Посмотреть тест
                    </Button>
                    <Button className="rounded-button" size="l" type="submit" stretched>
                        Сохранить черновик
                    </Button>
                    <p className="builder-hint">
                        Можно сохранить незаконченный тест. Черновик будет доступен только на этом
                        устройстве.
                    </p>
                    {feedback && (
                        <p
                            className={`builder-feedback builder-feedback--${feedback.kind}`}
                            role={feedback.kind === 'error' ? 'alert' : 'status'}
                        >
                            {feedback.text}
                        </p>
                    )}
                </div>
            </form>
        </>
    );
}
