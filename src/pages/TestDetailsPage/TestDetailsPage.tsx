import { useNavigate, useParams } from 'react-router-dom';
import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { Hero } from '../../components/Hero';
import { readyTests } from '../../data';
import { formatQuestionCount } from '../../utils';
import { NotFoundPage } from '../NotFoundPage';
import './TestDetailsPage.css';

export function TestDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const test = readyTests.find((item) => item.id === id);
    if (!test) return <NotFoundPage />;

    return (
        <>
            <Hero
                compact
                emoji={test.emoji}
                eyebrow={formatQuestionCount(test.questions.length).toLocaleUpperCase('ru')}
                title={test.title}
                description={test.ownerDescription}
            />
            <Section header="Что ты узнаешь" className="details-section">
                {test.topics.map((topic, index) => (
                    <Cell
                        key={topic}
                        readOnly
                        multiline
                        before={<span className="topic-number">{index + 1}</span>}
                    >
                        {topic}
                    </Cell>
                ))}
            </Section>
            <Section header="Как это будет работать" className="details-section how-it-works">
                <Cell readOnly multiline subtitle="Вопросы и варианты уже готовы">
                    Выбираешь готовый тест
                </Cell>
                <Cell readOnly multiline subtitle="Друзья выбирают один ответ на каждый вопрос">
                    Отправляешь ссылку в Telegram
                </Cell>
                <Cell readOnly multiline subtitle="Только сводная статистика, без имён">
                    Смотришь общее мнение
                </Cell>
            </Section>
            <div className="detail-actions">
                <Button
                    className="rounded-button"
                    size="l"
                    stretched
                    onClick={() => navigate(`/tests/${test.id}/preview`)}
                >
                    Посмотреть вопросы
                </Button>
                <Button
                    className="rounded-button"
                    size="l"
                    stretched
                    mode="plain"
                    onClick={() => navigate('/')}
                >
                    К тестам
                </Button>
            </div>
        </>
    );
}
