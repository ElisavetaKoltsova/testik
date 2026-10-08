export interface TestOption {
    id: string;
    text: string;
}

export interface TestQuestion {
    id: string;
    text: string;
    options: TestOption[];
}

export interface TestContent {
    title: string;
    questions: TestQuestion[];
}
