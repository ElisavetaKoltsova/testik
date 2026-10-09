export interface CustomTestInput {
    title: string;
    questions: { id: string; text: string; options: { id: string; text: string }[] }[];
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
        !hasOnlyKeys(value, ['title', 'questions']) ||
        !text(value.title, 200) ||
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
            !hasOnlyKeys(question, ['id', 'text', 'options']) ||
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
                !hasOnlyKeys(option, ['id', 'text']) ||
                !validId(option.id) ||
                !text(option.text, 500)
            )
                return null;
            options.push({ id: option.id, text: option.text.trim() });
        }
        questions.push({ id: question.id, text: question.text.trim(), options });
    }
    return { title: value.title.trim(), questions };
}
