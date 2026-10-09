import { CUSTOM_TEST_LIMITS } from '../config';
import { getCustomTestMaximum } from './customTestScoring';

import type { TestContent, TestQuestion, TestOption } from './testContent';

export type CustomTestMode = 'quiz' | 'scored';
export type DraftOption = TestOption & { score?: number };
export type DraftQuestion = Omit<TestQuestion, 'options'> & {
    options: DraftOption[];
    correctOptionId?: string;
};
export interface DraftResult {
    id: string;
    title: string;
    description: string;
    minScore: number;
    maxScore: number;
}
export type CustomTestDraft = Omit<TestContent, 'questions'> & {
    mode?: CustomTestMode;
    questions: DraftQuestion[];
    results?: DraftResult[];
};

export function normalizeCustomTestDraft(draft: CustomTestDraft): CustomTestDraft {
    return {
        title: draft.title,
        mode: draft.mode ?? 'quiz',
        questions: draft.questions.map((question) => ({
            id: question.id,
            text: question.text,
            ...(question.correctOptionId ? { correctOptionId: question.correctOptionId } : {}),
            options: question.options.map((option) => ({
                id: option.id,
                text: option.text,
                score: option.score ?? 0,
            })),
        })),
        results: draft.results ?? [],
    };
}
export function createDraftOption(): DraftOption {
    return { id: crypto.randomUUID(), text: '', score: 0 };
}

export function createDraftQuestion(): DraftQuestion {
    return {
        id: crypto.randomUUID(),
        text: '',
        options: Array.from({ length: CUSTOM_TEST_LIMITS.minOptions }, createDraftOption),
    };
}

export function createCustomTestDraft(): CustomTestDraft {
    return { title: '', mode: 'quiz', questions: [createDraftQuestion()], results: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

// Проверяем структуру при восстановлении. Незаконченные тексты допустимы в черновике.
export function isCustomTestDraft(value: unknown): value is CustomTestDraft {
    if (!isRecord(value) || typeof value.title !== 'string' || !Array.isArray(value.questions)) {
        return false;
    }
    if (value.mode !== undefined && value.mode !== 'quiz' && value.mode !== 'scored') return false;
    if (value.questions.length < 1 || value.questions.length > CUSTOM_TEST_LIMITS.maxQuestions) {
        return false;
    }
    const ids = new Set<string>();
    const validId = (id: unknown): id is string => {
        if (typeof id !== 'string' || !id || ids.has(id)) return false;
        ids.add(id);
        return true;
    };
    const validQuestions = value.questions.every((question) => {
        if (
            !isRecord(question) ||
            !validId(question.id) ||
            typeof question.text !== 'string' ||
            (question.correctOptionId !== undefined &&
                typeof question.correctOptionId !== 'string') ||
            !Array.isArray(question.options)
        )
            return false;
        if (
            question.options.length < CUSTOM_TEST_LIMITS.minOptions ||
            question.options.length > CUSTOM_TEST_LIMITS.maxOptions
        )
            return false;
        return question.options.every(
            (option) =>
                isRecord(option) &&
                validId(option.id) &&
                typeof option.text === 'string' &&
                (option.score === undefined ||
                    (typeof option.score === 'number' &&
                        Number.isInteger(option.score) &&
                        option.score >= 0 &&
                        option.score <= 5)),
        );
    });
    return (
        validQuestions &&
        (value.results === undefined ||
            (Array.isArray(value.results) &&
                value.results.length <= 5 &&
                value.results.every(
                    (result) =>
                        isRecord(result) &&
                        validId(result.id) &&
                        typeof result.title === 'string' &&
                        typeof result.description === 'string' &&
                        typeof result.minScore === 'number' &&
                        typeof result.maxScore === 'number' &&
                        Number.isFinite(result.minScore) &&
                        Number.isFinite(result.maxScore),
                )))
    );
}

export function getDraftValidationError(draft: CustomTestDraft): string | null {
    if (!isCustomTestDraft(draft)) return 'Проверь количество вопросов и вариантов ответа.';
    if (!draft.title.trim()) return 'Добавь название теста.';
    if (draft.title.length > 200) return 'Сократи название до 200 символов.';
    for (const [questionIndex, question] of draft.questions.entries()) {
        if (!question.text.trim()) return `Добавь текст вопроса ${questionIndex + 1}.`;
        if (question.text.length > 1000)
            return `Сократи вопрос ${questionIndex + 1} до 1000 символов.`;
        if (
            draft.mode === 'quiz' &&
            !question.options.some((option) => option.id === question.correctOptionId)
        )
            return `Отметь правильный ответ у вопроса ${questionIndex + 1}.`;
        for (const [optionIndex, option] of question.options.entries()) {
            if (!option.text.trim())
                return `Заполни вариант ${optionIndex + 1} у вопроса ${questionIndex + 1}.`;
            if (option.text.length > 500)
                return `Сократи вариант ${optionIndex + 1} у вопроса ${questionIndex + 1} до 500 символов.`;
        }
    }
    const results = [...(draft.results ?? [])].sort((a, b) => a.minScore - b.minScore);
    let nextScore = 0;
    for (const result of results) {
        if (!result.title.trim() || !result.description.trim())
            return 'Заполни название и описание каждого результата.';
        if (result.title.length > 200 || result.description.length > 2000)
            return 'Название результата — до 200 символов, описание — до 2000.';
        if (
            !Number.isInteger(result.minScore) ||
            !Number.isInteger(result.maxScore) ||
            result.minScore < 0 ||
            result.maxScore > 50 ||
            result.minScore > result.maxScore
        )
            return 'Укажи целые границы результатов от 0 до 50: «от» не больше «до».';
        if (result.minScore !== nextScore)
            return 'Диапазоны результатов должны идти от 0 подряд, без пропусков и пересечений.';
        nextScore = result.maxScore + 1;
    }
    const maximum = getCustomTestMaximum(draft);
    if (results.length && nextScore <= maximum)
        return `Диапазоны результатов должны покрывать сумму от 0 до ${maximum}.`;
    return null;
}
