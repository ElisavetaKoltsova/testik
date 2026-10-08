import type { ReadyTest, ReadyTestResult } from './readyTests';

export function getReadyTestResults(
    test: ReadyTest,
    answers: Record<string, string>,
): ReadyTestResult[] {
    const scores = new Map(test.results.map((result) => [result.id, 0]));

    for (const question of test.questions) {
        const selectedOption = question.options.find(
            (option) => option.id === answers[question.id],
        );
        if (!selectedOption) return [];

        for (const [resultId, points] of Object.entries(selectedOption.points)) {
            if (
                !scores.has(resultId) ||
                points === undefined ||
                !Number.isFinite(points) ||
                points < 0
            ) {
                throw new Error(`Некорректные баллы у варианта ${selectedOption.id}`);
            }
            scores.set(resultId, scores.get(resultId)! + points);
        }
    }

    const maxScore = Math.max(...scores.values());
    return test.results.filter((result) => scores.get(result.id) === maxScore);
}
