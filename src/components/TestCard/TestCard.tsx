import { Link } from 'react-router-dom';
import { Cell } from '@telegram-apps/telegram-ui';
import type { ReadyTest } from '../../data';
import './TestCard.css';

interface TestCardProps {
    test: ReadyTest;
}

export function TestCard({ test }: TestCardProps) {
    return (
        <Link to={`/tests/${test.id}`} className="test-card">
            <Cell
                readOnly
                multiline
                before={
                    <span className="test-icon" aria-hidden="true">
                        {test.emoji}
                    </span>
                }
                after={
                    <span className="test-chevron" aria-hidden="true">
                        ›
                    </span>
                }
                subtitle={`${test.questionCount} вопроса · около минуты`}
            >
                {test.title}
            </Cell>
        </Link>
    );
}
