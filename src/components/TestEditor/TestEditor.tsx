import type { FormEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@telegram-apps/telegram-ui';
import { QuestionEditor } from '../QuestionEditor';
import { ServerTestSave } from '../ServerTestSave';
import type { PersonalTestDraft } from '../../api';
import { CUSTOM_TEST_LIMITS } from '../../config';
import { useTestBuilder, useServerTestSave } from '../../hooks';
import './TestEditor.css';

export function TestEditor({ initial }: { initial?: PersonalTestDraft }) {
    const {
        draft,
        testId,
        hasLocalDraft,
        restoreDraft,
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
    } = useTestBuilder(initial);
    const serverSave = useServerTestSave(draft, testId);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isPreview = pathname.endsWith('/preview');
    const editorPath = initial ? `/my-tests/${initial.id}/edit` : '/create';
    const handlePreview = () => {
        if (validateForPreview()) navigate(`${editorPath}/preview`);
    };
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        saveDraft();
    };
    const handleServerSave = async () => {
        if (serverSave.saving || !validateForPreview()) return;
        saveDraft();
        if (await serverSave.save()) navigate('/my-tests', { state: { saved: true } });
    };
    if (isPreview) return <Outlet context={{ draft, editorPath }} />;

    return (
        <>
            <header className="builder-header">
                <p className="eyebrow">КОНСТРУКТОР</p>
                <h1>{initial ? 'Редактировать тест' : 'Свой тест'}</h1>
                <p>Придумай вопросы, на которые интересно услышать ответы друзей.</p>
            </header>
            <form className="test-builder" onSubmit={handleSubmit}>
                <fieldset className="editor-fields" disabled={serverSave.saving}>
                    {!initial && hasLocalDraft && (
                        <Button
                            className="rounded-button"
                            type="button"
                            mode="outline"
                            stretched
                            onClick={restoreDraft}
                        >
                            Открыть локальный черновик
                        </Button>
                    )}
                    <div className="builder-title-field">
                        <label htmlFor="test-title">Название теста</label>
                        <Input
                            id="test-title"
                            value={draft.title}
                            maxLength={200}
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
                        В каждом — от {CUSTOM_TEST_LIMITS.minOptions} до{' '}
                        {CUSTOM_TEST_LIMITS.maxOptions} вариантов. При прохождении выбирается один
                        ответ.
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
                            Можно сохранить незаконченный тест на этом устройстве. При следующем
                            входе открой его кнопкой «Открыть локальный черновик».
                        </p>
                        {feedback && (
                            <p
                                className={`builder-feedback builder-feedback--${feedback.kind}`}
                                role={feedback.kind === 'error' ? 'alert' : 'status'}
                            >
                                {feedback.text}
                            </p>
                        )}
                        <ServerTestSave
                            saving={serverSave.saving}
                            message={serverSave.message}
                            isError={serverSave.isError}
                            onSave={handleServerSave}
                        />
                    </div>
                </fieldset>
            </form>
        </>
    );
}
