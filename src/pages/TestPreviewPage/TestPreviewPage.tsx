import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { CustomTestResult, TestPreview } from '../../components';
import { getDraftValidationError } from '../../data';
import type { CustomTestDraft } from '../../data';

export function TestPreviewPage() {
    const { draft, editorPath } = useOutletContext<{
        draft: CustomTestDraft;
        editorPath: string;
    }>();
    const navigate = useNavigate();
    const error = getDraftValidationError(draft);
    if (error)
        return (
            <Placeholder header="Заполни тест для предпросмотра" description={error}>
                <Button className="rounded-button" size="l" onClick={() => navigate(editorPath)}>
                    К редактированию
                </Button>
            </Placeholder>
        );
    return (
        <TestPreview
            content={draft}
            returnTo={editorPath}
            returnLabel="К редактированию"
            firstBackLabel="К редактору"
            renderResult={(answers) => <CustomTestResult draft={draft} answers={answers} />}
        />
    );
}
