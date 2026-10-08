import { Section } from '@telegram-apps/telegram-ui';
import { Hero, TestCard, CustomTestCard } from '../../components';
import { readyTests } from '../../data';
import './HomePage.css';

export function HomePage() {
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
            <p className="privacy-note">
                Личные ответы — общая картина.
                <br />
                Имена друзей не отображаются в результатах.
            </p>
        </>
    );
}
