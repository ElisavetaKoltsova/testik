import { Button } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import { CUSTOM_TEST_LIMITS } from '../../config';
import './CustomTestCard.css';

export function CustomTestCard() {
    const navigate = useNavigate();
    return (
        <section className="custom-test-card" aria-labelledby="custom-test-title">
            <h2 id="custom-test-title">А можно придумать свой</h2>
            <p>
                До {CUSTOM_TEST_LIMITS.maxQuestions} вопросов и от {CUSTOM_TEST_LIMITS.minOptions}{' '}
                до {CUSTOM_TEST_LIMITS.maxOptions} вариантов ответа в каждом.
            </p>
            <Button
                className="rounded-button"
                size="l"
                stretched
                onClick={() => navigate('/create')}
            >
                Создать свой тест
            </Button>
        </section>
    );
}
