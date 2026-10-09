import { useEffect, useRef } from 'react';
import { getCustomTestMaximum, getCustomTestResult, getCustomTestScore } from '../../data';
import type { CustomTestDraft } from '../../data';
import './CustomTestResult.css';

export function CustomTestResult({
    draft,
    answers,
}: {
    draft: CustomTestDraft;
    answers: Record<string, string>;
}) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        headingRef.current?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }, []);
    const score = getCustomTestScore(draft, answers);
    const result = getCustomTestResult(draft, score);
    return (
        <section className="custom-test-result" aria-labelledby="custom-result-title">
            <p className="eyebrow">ПРЕДПРОСМОТР</p>
            <h1 id="custom-result-title" tabIndex={-1} ref={headingRef}>
                {result?.title ?? 'Результат теста'}
            </h1>
            <p className="custom-test-score">
                {score} из {getCustomTestMaximum(draft)} баллов
            </p>
            {draft.mode === 'quiz' && (
                <p>
                    Правильных ответов: {score} из {draft.questions.length}.
                </p>
            )}
            {result && <p className="custom-result-description">{result.description}</p>}
        </section>
    );
}
