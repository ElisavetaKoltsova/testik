import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { TestPreview } from '../../components';
import { getDraftValidationError } from '../../data';
import type { CustomTestDraft } from '../../data';

export function TestPreviewPage() {
    const { draft } = useOutletContext<{ draft: CustomTestDraft }>();
    const navigate = useNavigate();
    const error = getDraftValidationError(draft);
    if (error)
        return (
            <Placeholder header="Заполни тест для предпросмотра" description={error}>
                <Button className="rounded-button" size="l" onClick={() => navigate('/create')}>
                    К редактированию
                </Button>
            </Placeholder>
        );
    return (
        <TestPreview
            content={draft}
            returnTo="/create"
            returnLabel="К редактированию"
            firstBackLabel="К редактору"
        />
    );
}
