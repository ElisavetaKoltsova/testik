import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCustomTest } from './customTest.js';
import {
    getDraftValidationError,
    normalizeCustomTestDraft,
} from '../../src/data/customTestDraft.js';
import {
    getCustomTestMaximum,
    getCustomTestScore,
    getCustomTestResult,
} from '../../src/data/customTestScoring.js';

const scored = () => ({
    title: 'Балльный тест',
    mode: 'scored' as const,
    questions: [
        {
            id: 'q1',
            text: 'Первый?',
            options: [
                { id: 'a1', text: 'Нет', score: 0 },
                { id: 'a2', text: 'Да', score: 5 },
            ],
        },
        {
            id: 'q2',
            text: 'Второй?',
            options: [
                { id: 'b1', text: 'Нет', score: 0 },
                { id: 'b2', text: 'Да', score: 2 },
            ],
        },
    ],
    results: [
        { id: 'r1', title: 'Низкий', description: 'До трёх.', minScore: 0, maxScore: 3 },
        { id: 'r2', title: 'Высокий', description: 'От четырёх.', minScore: 4, maxScore: 7 },
    ],
});

test('Scored test sums only current selections and resolves inclusive result boundaries', () => {
    const draft = scored();
    assert.deepEqual(parseCustomTest(draft), draft);
    assert.equal(getDraftValidationError(draft), null);
    assert.equal(getCustomTestMaximum(draft), 7);
    for (const [a, b, score] of [
        ['a1', 'b1', 0],
        ['a1', 'b2', 2],
        ['a2', 'b1', 5],
        ['a2', 'b2', 7],
    ] as const)
        assert.equal(getCustomTestScore(draft, { q1: a, q2: b }), score);
    assert.equal(getCustomTestScore(draft, { q1: 'foreign', q2: 'b2' }), 2);
    assert.equal(getCustomTestResult(draft, 3)?.id, 'r1');
    assert.equal(getCustomTestResult(draft, 4)?.id, 'r2');
    assert.equal(getCustomTestResult(draft, 7)?.id, 'r2');
});

test('Quiz uses one correct option per question and does not use weighted scores', () => {
    const draft = {
        ...scored(),
        mode: 'quiz' as const,
        results: [],
        questions: scored().questions.map((question, index) => ({
            ...question,
            correctOptionId: index ? 'b2' : 'a1',
        })),
    };
    assert.deepEqual(parseCustomTest(draft), draft);
    assert.equal(getCustomTestMaximum(draft), 2);
    assert.equal(getCustomTestScore(draft, { q1: 'a1', q2: 'b2' }), 2);
    assert.equal(getCustomTestScore(draft, { q1: 'a2', q2: 'b1' }), 0);
    assert.equal(getCustomTestScore(draft, { q1: 'a1', q2: 'b1' }), 1);
    const legacy = normalizeCustomTestDraft({
        title: 'Старый',
        questions: [
            {
                id: 'q',
                text: '?',
                options: [
                    { id: 'x', text: 'Да' },
                    { id: 'y', text: 'Нет' },
                ],
            },
        ],
    });
    assert.equal(legacy.mode, 'quiz');
    assert.match(getDraftValidationError(legacy)!, /правильный ответ/);
    assert.ok(parseCustomTest({ title: 'Старый', questions: legacy.questions }));
});

test('Server rejects invalid scores, correct IDs and ambiguous or incomplete ranges', () => {
    const invalid: unknown[] = [
        { ...scored(), mode: 'unknown' },
        { ...scored(), mode: 'quiz' },
        ...[-1, 6, 1.5, '5', null].map((score) => ({
            ...scored(),
            questions: [
                {
                    ...scored().questions[0],
                    options: [
                        { id: 'a1', text: 'Нет', score },
                        { id: 'a2', text: 'Да', score: 5 },
                    ],
                },
            ],
        })),
        ...[
            { minScore: 3 },
            { minScore: 5 },
            { maxScore: 6 },
            { minScore: 8 },
            { maxScore: 51 },
            { maxScore: 6.5 },
            { title: ' ' },
            { description: '' },
            { id: 'a1' },
        ].map((patch) => ({
            ...scored(),
            results: [scored().results[0], { ...scored().results[1], ...patch }],
        })),
        { ...scored(), results: [{ ...scored().results[0], minScore: -1 }] },
        {
            ...scored(),
            results: Array.from({ length: 6 }, (_, i) => ({ ...scored().results[0], id: `r${i}` })),
        },
        { ...scored(), questions: [{ ...scored().questions[0], correctOptionId: 'foreign' }] },
    ];
    for (const input of invalid) assert.equal(parseCustomTest(input), null, JSON.stringify(input));
    assert.ok(parseCustomTest({ ...scored(), results: [] }));
    assert.ok(parseCustomTest({ ...scored(), results: [...scored().results].reverse() }));
});
