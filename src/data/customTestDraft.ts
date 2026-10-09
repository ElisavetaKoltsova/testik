import { CUSTOM_TEST_LIMITS } from '../config';

import type { TestContent, TestQuestion, TestOption } from './testContent';

export type DraftOption = TestOption;
export type DraftQuestion = TestQuestion;
export type CustomTestDraft = TestContent;
export function createDraftOption(): DraftOption {
    return { id: crypto.randomUUID(), text: '' };
}

export function createDraftQuestion(): DraftQuestion {
    return {
        id: crypto.randomUUID(),
        text: '',
        options: Array.from({ length: CUSTOM_TEST_LIMITS.minOptions }, createDraftOption),
    };
}

export function createCustomTestDraft(): CustomTestDraft {
    return { title: '', questions: [createDraftQuestion()] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

// Проверяем структуру при восстановлении. Незаконченные тексты допустимы в черновике.
export function isCustomTestDraft(value: unknown): value is CustomTestDraft {
    if (!isRecord(value) || typeof value.title !== 'string' || !Array.isArray(value.questions)) {
        return false;
    }
    if (value.questions.length < 1 || value.questions.length > CUSTOM_TEST_LIMITS.maxQuestions) {
        return false;
    }
    const ids = new Set<string>();
    const validId = (id: unknown): id is string => {
        if (typeof id !== 'string' || !id || ids.has(id)) return false;
        ids.add(id);
        return true;
    };
    return value.questions.every((question) => {
        if (
            !isRecord(question) ||
            !validId(question.id) ||
            typeof question.text !== 'string' ||
            !Array.isArray(question.options)
        )
            return false;
        if (
            question.options.length < CUSTOM_TEST_LIMITS.minOptions ||
            question.options.length > CUSTOM_TEST_LIMITS.maxOptions
        )
            return false;
        return question.options.every(
            (option) => isRecord(option) && validId(option.id) && typeof option.text === 'string',
        );
    });
}

export function getDraftValidationError(draft: CustomTestDraft): string | null {
    if (!isCustomTestDraft(draft)) return 'Проверь количество вопросов и вариантов ответа.';
    if (!draft.title.trim()) return 'Добавь название теста.';
    if (draft.title.length > 200) return 'Сократи название до 200 символов.';
    for (const [questionIndex, question] of draft.questions.entries()) {
        if (!question.text.trim()) return `Добавь текст вопроса ${questionIndex + 1}.`;
        if (question.text.length > 1000)
            return `Сократи вопрос ${questionIndex + 1} до 1000 символов.`;
        for (const [optionIndex, option] of question.options.entries()) {
            if (!option.text.trim())
                return `Заполни вариант ${optionIndex + 1} у вопроса ${questionIndex + 1}.`;
            if (option.text.length > 500)
                return `Сократи вариант ${optionIndex + 1} у вопроса ${questionIndex + 1} до 500 символов.`;
        }
    }
    return null;
}
