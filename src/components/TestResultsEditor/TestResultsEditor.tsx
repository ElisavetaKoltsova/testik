import { Button, Input, Textarea } from '@telegram-apps/telegram-ui';
import type { DraftResult } from '../../data';
import './TestResultsEditor.css';

interface TestResultsEditorProps {
    results: DraftResult[];
    maximum: number;
    onAdd: () => void;
    onRemove: (id: string) => void;
    onChange: (id: string, patch: Partial<Omit<DraftResult, 'id'>>) => void;
}

export function TestResultsEditor({
    results,
    maximum,
    onAdd,
    onRemove,
    onChange,
}: TestResultsEditorProps) {
    return (
        <section className="test-results-editor" aria-labelledby="results-editor-title">
            <h2 id="results-editor-title">Результаты · {results.length} из 5</h2>
            <p className="builder-hint">
                Можно добавить название и описание для разных сумм. Диапазоны включают обе границы и
                должны идти подряд от 0 как минимум до {maximum}. Без результатов покажем только
                набранные баллы.
            </p>
            {results.map((result, index) => (
                <section
                    className="result-editor-card"
                    key={result.id}
                    aria-label={`Результат ${index + 1}`}
                >
                    <div className="result-editor-heading">
                        <h3>Результат {index + 1}</h3>
                        <Button
                            mode="plain"
                            size="s"
                            className="remove-result"
                            aria-label={`Удалить результат ${index + 1}`}
                            onClick={() => onRemove(result.id)}
                        >
                            Удалить
                        </Button>
                    </div>
                    <label htmlFor={`result-title-${result.id}`}>
                        Название результата {index + 1}
                    </label>
                    <Input
                        id={`result-title-${result.id}`}
                        value={result.title}
                        maxLength={200}
                        placeholder="Например: Отличный результат"
                        onChange={(event) => onChange(result.id, { title: event.target.value })}
                    />
                    <label htmlFor={`result-description-${result.id}`}>
                        Описание результата {index + 1}
                    </label>
                    <Textarea
                        id={`result-description-${result.id}`}
                        value={result.description}
                        maxLength={2000}
                        rows={2}
                        placeholder="Что означает этот результат?"
                        onChange={(event) =>
                            onChange(result.id, { description: event.target.value })
                        }
                    />
                    <div className="result-score-range">
                        <div>
                            <label htmlFor={`result-min-${result.id}`}>От баллов</label>
                            <Input
                                id={`result-min-${result.id}`}
                                aria-label={`От баллов · результат ${index + 1}`}
                                type="number"
                                min={0}
                                max={50}
                                step={1}
                                value={result.minScore}
                                onChange={(event) =>
                                    onChange(result.id, { minScore: Number(event.target.value) })
                                }
                            />
                        </div>
                        <div>
                            <label htmlFor={`result-max-${result.id}`}>До баллов</label>
                            <Input
                                id={`result-max-${result.id}`}
                                aria-label={`До баллов · результат ${index + 1}`}
                                type="number"
                                min={0}
                                max={50}
                                step={1}
                                value={result.maxScore}
                                onChange={(event) =>
                                    onChange(result.id, { maxScore: Number(event.target.value) })
                                }
                            />
                        </div>
                    </div>
                </section>
            ))}
            <Button
                className="rounded-button"
                mode="outline"
                stretched
                disabled={results.length >= 5}
                onClick={onAdd}
            >
                + Добавить результат
            </Button>
        </section>
    );
}
