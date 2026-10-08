import { useEffect, useRef } from 'react';
import type { ReadyTestResult } from '../../data';
import './TestResult.css';

interface TestResultProps {
    results: ReadyTestResult[];
}

export function TestResult({ results }: TestResultProps) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        headingRef.current?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }, []);

    return (
        <section className="test-result" aria-labelledby="test-result-title">
            <p className="eyebrow">ПРЕДПРОСМОТР</p>
            <h1 id="test-result-title" ref={headingRef} tabIndex={-1}>
                {results.length > 1 ? 'Несколько типов совпали' : 'Результат теста'}
            </h1>
            {results.length > 1 && (
                <p className="test-result-hint">
                    Эти типы набрали одинаковое максимальное число баллов.
                </p>
            )}
            {results.map((result) => (
                <article key={result.id} className="test-result-card">
                    <span className="test-result-emoji" aria-hidden="true">
                        {result.emoji}
                    </span>
                    <h2>{result.title}</h2>
                    <p>{result.description}</p>
                </article>
            ))}
        </section>
    );
}
