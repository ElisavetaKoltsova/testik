import { Button, Section } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import { Hero, TestCard, CustomTestCard } from '../../components';
import { readyTests } from '../../data';
import './HomePage.css';

export function HomePage() {
    const navigate = useNavigate();
    return (
        <>
            <Hero
                emoji="💬"
                eyebrow="ТЕСТИК"
                title={
                    <>
                        Узнай себя
                        <br />
                        глазами друзей
                    </>
                }
                description={
                    <>
                        Выбери готовый тест о себе
                        <br />
                        или придумай свой.
                    </>
                }
            />
            <Section header="Готовые тесты" className="ready-tests">
                {readyTests.map((test) => (
                    <TestCard key={test.id} test={test} />
                ))}
            </Section>
            <CustomTestCard />
            <Button
                className="rounded-button my-tests-button"
                size="l"
                mode="outline"
                stretched
                onClick={() => navigate('/my-tests')}
            >
                Мои тесты
            </Button>
            <p className="privacy-note">
                Личные ответы — общая картина.
                <br />
                Имена друзей не отображаются в результатах.
            </p>
        </>
    );
}
