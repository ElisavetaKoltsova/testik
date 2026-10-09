export interface CustomTestInput {
    title: string;
    subjectName?: string;
    mode?: 'quiz' | 'scored';
    questions: {
        id: string;
        text: string;
        correctOptionId?: string;
        options: { id: string; text: string; score?: number }[];
    }[];
    results?: {
        id: string;
        title: string;
        description: string;
        minScore: number;
        maxScore: number;
    }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
    return Object.keys(value).every((key) => keys.includes(key));
}

function text(value: unknown, maxLength: number): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function parseCustomTest(value: unknown): CustomTestInput | null {
    if (
        !isRecord(value) ||
        !hasOnlyKeys(value, ['title', 'subjectName', 'mode', 'questions', 'results']) ||
        (value.mode !== undefined && value.mode !== 'quiz' && value.mode !== 'scored') ||
        !text(value.title, 200) ||
        (value.subjectName !== undefined &&
            (typeof value.subjectName !== 'string' || value.subjectName.length > 100)) ||
        !Array.isArray(value.questions) ||
        value.questions.length < 1 ||
        value.questions.length > 10
    )
        return null;

    const ids = new Set<string>();
    const validId = (id: unknown): id is string => {
        if (typeof id !== 'string' || !/^[a-z\d_-]{1,64}$/i.test(id) || ids.has(id)) return false;
        ids.add(id);
        return true;
    };
    const questions: CustomTestInput['questions'] = [];
    for (const question of value.questions) {
        if (
            !isRecord(question) ||
            !hasOnlyKeys(question, ['id', 'text', 'options', 'correctOptionId']) ||
            !validId(question.id) ||
            !text(question.text, 1000) ||
            !Array.isArray(question.options) ||
            question.options.length < 2 ||
            question.options.length > 6
        )
            return null;
        const options: CustomTestInput['questions'][number]['options'] = [];
        for (const option of question.options) {
            if (
                !isRecord(option) ||
                !hasOnlyKeys(option, ['id', 'text', 'score']) ||
                !validId(option.id) ||
                !text(option.text, 500) ||
                (option.score !== undefined &&
                    (typeof option.score !== 'number' ||
                        !Number.isInteger(option.score) ||
                        option.score < 0 ||
                        option.score > 5))
            )
                return null;
            options.push({
                id: option.id,
                text: option.text.trim(),
                ...(option.score !== undefined ? { score: option.score as number } : {}),
            });
        }
        if (
            (value.mode === 'quiz' || question.correctOptionId !== undefined) &&
            !options.some((option) => option.id === question.correctOptionId)
        )
            return null;
        questions.push({
            id: question.id,
            text: question.text.trim(),
            options,
            ...(question.correctOptionId !== undefined
                ? { correctOptionId: question.correctOptionId as string }
                : {}),
        });
    }
    const results: NonNullable<CustomTestInput['results']> = [];
    if (value.results !== undefined) {
        if (!Array.isArray(value.results) || value.results.length > 5) return null;
        for (const result of value.results) {
            if (
                !isRecord(result) ||
                !hasOnlyKeys(result, ['id', 'title', 'description', 'minScore', 'maxScore']) ||
                !validId(result.id) ||
                !text(result.title, 200) ||
                !text(result.description, 2000) ||
                typeof result.minScore !== 'number' ||
                typeof result.maxScore !== 'number' ||
                !Number.isInteger(result.minScore) ||
                !Number.isInteger(result.maxScore) ||
                result.minScore < 0 ||
                result.maxScore > 50 ||
                result.minScore > result.maxScore
            )
                return null;
            results.push({
                id: result.id,
                title: result.title.trim(),
                description: result.description.trim(),
                minScore: result.minScore,
                maxScore: result.maxScore,
            });
        }
        const sorted = [...results].sort((a, b) => a.minScore - b.minScore);
        let nextScore = 0;
        for (const result of sorted) {
            if (result.minScore !== nextScore) return null;
            nextScore = result.maxScore + 1;
        }
        const maximum =
            value.mode === 'quiz'
                ? questions.length
                : questions.reduce(
                      (sum, question) =>
                          sum + Math.max(...question.options.map((option) => option.score ?? 0)),
                      0,
                  );
        if (results.length && nextScore <= maximum) return null;
    }
    const subjectName = typeof value.subjectName === 'string' ? value.subjectName.trim() : '';
    return {
        title: value.title.trim(),
        ...(subjectName ? { subjectName } : {}),
        ...(value.mode ? { mode: value.mode as 'quiz' | 'scored' } : {}),
        questions,
        ...(value.results !== undefined ? { results } : {}),
    };
}
