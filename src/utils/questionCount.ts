const questionPluralRules = new Intl.PluralRules('ru');

export function formatQuestionCount(count: number): string {
    const form = questionPluralRules.select(count);
    const word = form === 'one' ? 'вопрос' : form === 'few' ? 'вопроса' : 'вопросов';
    return `${count} ${word}`;
}
