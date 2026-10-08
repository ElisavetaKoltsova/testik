export interface ReadyTest {
    id: string;
    emoji: string;
    title: string;
    description: string;
    questionCount: number;
    topics: string[];
}

export const readyTests: ReadyTest[] = [
    {
        id: 'person',
        emoji: '🪞',
        title: 'Каким человеком вы меня видите?',
        description: 'Узнай, какие качества замечают в тебе друзья и что они ценят больше всего.',
        questionCount: 3,
        topics: ['Первое впечатление', 'Твои сильные стороны', 'Твоя роль в компании'],
    },
    {
        id: 'vibe',
        emoji: '✨',
        title: 'Какой у меня вайб?',
        description:
            'Посмотри на свою энергию глазами друзей: какие ощущения и ассоциации ты вызываешь.',
        questionCount: 3,
        topics: ['Ассоциации с тобой', 'Твоя энергия', 'Цвет твоего вайба'],
    },
];
