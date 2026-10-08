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

function loadDraft(): { draft: CustomTestDraft; feedback: Feedback | null } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved: unknown = JSON.parse(raw);
            if (!isCustomTestDraft(saved)) throw new Error('Invalid draft');
            return {
                draft: saved,
                feedback: { kind: 'info', text: 'Продолжим сохранённый черновик.' },
            };
        }
        return { draft: createCustomTestDraft(), feedback: null };
    } catch {
        return {
            draft: createCustomTestDraft(),
            feedback: {
                kind: 'error',
                text: 'Не удалось восстановить черновик. Можно начать новый.',
            },
        };
    }
}

export function useTestBuilder() {
    const [initial] = useState(loadDraft);
    const [draft, setDraft] = useState(initial.draft);
    const [feedback, setFeedback] = useState<Feedback | null>(initial.feedback);

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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
            setFeedback({ kind: 'saved', text: 'Черновик сохранён на этом устройстве.' });
        } catch {
            setFeedback({
                kind: 'error',
                text: 'Не удалось сохранить черновик. Не закрывай страницу и попробуй ещё раз.',
            });
        }
    };

    return {
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
    };
}
