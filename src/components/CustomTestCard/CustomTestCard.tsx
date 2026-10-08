import { Button } from '@telegram-apps/telegram-ui';
import { CUSTOM_TEST_LIMITS } from '../../config';
import './CustomTestCard.css';

export function CustomTestCard() {
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
                disabled
                aria-describedby="custom-test-status"
            >
                Создать свой тест
            </Button>
            <p id="custom-test-status" className="custom-test-status">
                Конструктор скоро появится
            </p>
        </section>
    );
}
