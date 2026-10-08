import readyTestsJson from './readyTests.json';
import type { TestContent, TestOption, TestQuestion } from './testContent';

export interface ReadyTestOption extends TestOption {
    points: Partial<Record<string, number>>;
}

export interface ReadyTestQuestion extends TestQuestion {
    options: ReadyTestOption[];
}

export interface ReadyTestResult {
    id: string;
    emoji: string;
    title: string;
    description: string;
}

export interface ReadyTest extends TestContent {
    id: string;
    version: number;
    emoji: string;
    ownerDescription: string;
    participantDescription: string;
    shareText: string;
    topics: string[];
    resultType: 'maxScore';
    results: ReadyTestResult[];
    questions: ReadyTestQuestion[];
}

export const readyTests: ReadyTest[] = readyTestsJson.map((test) => {
    if (test.resultType !== 'maxScore') {
        throw new Error(`Неизвестный тип результата теста ${test.id}: ${test.resultType}`);
    }
    return { ...test, resultType: test.resultType } satisfies ReadyTest;
});
