import type { CustomTestDraft } from './customTestDraft';

export function getCustomTestMaximum(draft: CustomTestDraft): number {
    return draft.mode === 'quiz'
        ? draft.questions.length
        : draft.questions.reduce(
              (sum, question) =>
                  sum + Math.max(...question.options.map((option) => option.score ?? 0)),
              0,
          );
}

export function getCustomTestScore(
    draft: CustomTestDraft,
    answers: Record<string, string>,
): number {
    return draft.questions.reduce((sum, question) => {
        const selected = question.options.find((option) => option.id === answers[question.id]);
        if (!selected) return sum;
        return (
            sum +
            (draft.mode === 'quiz'
                ? Number(selected.id === question.correctOptionId)
                : (selected.score ?? 0))
        );
    }, 0);
}

export function getCustomTestResult(draft: CustomTestDraft, score: number) {
    return draft.results?.find((result) => score >= result.minScore && score <= result.maxScore);
}
