import { useParams } from 'react-router-dom';
import { TestPreview, TestResult } from '../../components';
import { getReadyTestResults, readyTests } from '../../data';
import { NotFoundPage } from '../NotFoundPage';

export function ReadyTestPreviewPage() {
    const { id } = useParams();
    const test = readyTests.find((item) => item.id === id);
    if (!test) return <NotFoundPage />;
    return (
        <TestPreview
            key={`${test.id}:${test.version}`}
            content={test}
            returnTo={`/tests/${test.id}`}
            returnLabel="К описанию"
            firstBackLabel="К описанию"
            description={test.participantDescription}
            renderResult={(answers) => <TestResult results={getReadyTestResults(test, answers)} />}
        />
    );
}
