import { useState } from 'react';
import { CUSTOM_TEST_LIMITS } from '../config';
import {
    createCustomTestDraft,
    createDraftOption,
    createDraftQuestion,
    isCustomTestDraft,
    getDraftValidationError,
} from '../data';
import type { CustomTestDraft, DraftQuestion } from '../data';

const STORAGE_KEY = 'testik.custom-test-draft.v1';

interface Feedback {
    kind: 'info' | 'saved' | 'error';
    text: string;
}

export function useTestBuilder(initial?: { id: string; draft: CustomTestDraft }) {
    const [testId, setTestId] = useState(() => initial?.id ?? crypto.randomUUID());
    const [draft, setDraft] = useState(() => initial?.draft ?? createCustomTestDraft());
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [hasLocalDraft, setHasLocalDraft] = useState(() => {
        try {
            return Boolean(localStorage.getItem(STORAGE_KEY));
        } catch {
            return false;
        }
    });

    const restoreDraft = () => {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
            if (isCustomTestDraft(saved)) {
                setDraft(saved);
                setTestId(crypto.randomUUID());
            } else if (
                typeof saved === 'object' &&
                saved !== null &&
                'draft' in saved &&
                isCustomTestDraft(saved.draft) &&
                'id' in saved &&
                typeof saved.id === 'string' &&
                /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(saved.id)
            ) {
                setDraft(saved.draft);
                setTestId(saved.id);
            } else throw new Error('Invalid draft');
            setFeedback({ kind: 'info', text: 'Открыт локальный черновик.' });
        } catch {
            setFeedback({ kind: 'error', text: 'Не удалось открыть локальный черновик.' });
        }
    };

    const updateDraft = (update: (current: CustomTestDraft) => CustomTestDraft) => {
        setDraft(update);
        setFeedback({ kind: 'info', text: 'Есть несохранённые изменения.' });
    };

    const updateQuestion = (id: string, update: (question: DraftQuestion) => DraftQuestion) => {
        updateDraft((current) => ({
            ...current,
            questions: current.questions.map((question) =>
                question.id === id ? update(question) : question,
            ),
        }));
    };

    const setTitle = (title: string) => updateDraft((current) => ({ ...current, title }));
    const addQuestion = () =>
        updateDraft((current) =>
            current.questions.length >= CUSTOM_TEST_LIMITS.maxQuestions
                ? current
                : { ...current, questions: [...current.questions, createDraftQuestion()] },
        );
    const removeQuestion = (id: string) =>
        updateDraft((current) =>
            current.questions.length <= 1
                ? current
                : {
                      ...current,
                      questions: current.questions.filter((question) => question.id !== id),
                  },
        );
    const setQuestionText = (id: string, text: string) =>
        updateQuestion(id, (question) => ({ ...question, text }));
    const setOptionText = (questionId: string, optionId: string, text: string) =>
        updateQuestion(questionId, (question) => ({
            ...question,
            options: question.options.map((option) =>
                option.id === optionId ? { ...option, text } : option,
            ),
        }));
    const addOption = (id: string) =>
        updateQuestion(id, (question) =>
            question.options.length >= CUSTOM_TEST_LIMITS.maxOptions
                ? question
                : { ...question, options: [...question.options, createDraftOption()] },
        );
    const removeOption = (questionId: string, optionId: string) =>
        updateQuestion(questionId, (question) =>
            question.options.length <= CUSTOM_TEST_LIMITS.minOptions
                ? question
                : {
                      ...question,
                      options: question.options.filter((option) => option.id !== optionId),
                  },
        );

    const validateForPreview = () => {
        const error = getDraftValidationError(draft);
        if (error) {
            setFeedback({ kind: 'error', text: error });
            return false;
        }
        setFeedback(null);
        return true;
    };

    const saveDraft = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: testId, draft }));
            setHasLocalDraft(true);
            setFeedback({ kind: 'saved', text: 'Черновик сохранён на этом устройстве.' });
        } catch {
            setFeedback({
                kind: 'error',
                text: 'Не удалось сохранить черновик. Не закрывай страницу и попробуй ещё раз.',
            });
        }
    };

    return {
        testId,
        draft,
        feedback,
        hasLocalDraft,
        restoreDraft,
        setTitle,
        addQuestion,
        removeQuestion,
        setQuestionText,
        setOptionText,
        addOption,
        removeOption,
        saveDraft,
        validateForPreview,
    };
}
