import { useEffect, useState } from 'react';
import { checkApiHealth } from '../api';

type ApiHealthStatus = 'checking' | 'available' | 'unavailable';

export function useApiHealth() {
    const [status, setStatus] = useState<ApiHealthStatus>('checking');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const timeout = window.setTimeout(() => controller.abort(), 5000);

        checkApiHealth(controller.signal)
            .then(() => {
                if (active) setStatus('available');
            })
            .catch(() => {
                if (active) setStatus('unavailable');
            })
            .finally(() => window.clearTimeout(timeout));

        return () => {
            active = false;
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [attempt]);

    const retry = () => {
        setStatus('checking');
        setAttempt((current) => current + 1);
    };

    return { status, retry };
}
