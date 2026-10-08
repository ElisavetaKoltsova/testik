import { buildApp } from './app.js';
import { createDatabaseClient } from './database/index.js';

const database = createDatabaseClient();
const app = buildApp({ logger: true, database });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
        app.close().catch((error: unknown) => {
            app.log.error(error);
            process.exitCode = 1;
        });
    });
}

try {
    await app.listen({ port: 3001, host: '127.0.0.1' });
} catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'EADDRINUSE') {
        app.log.error('Порт 3001 занят. Останови прежний API перед повторным запуском.');
    } else {
        app.log.error('API не запущен. Проверь Docker и настройки базы в локальном .env.');
    }
    await app.close();
    process.exitCode = 1;
}
