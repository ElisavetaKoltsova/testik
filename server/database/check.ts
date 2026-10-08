import { createDatabaseClient } from './index.js';

const database = createDatabaseClient();

try {
    await database.$queryRaw`SELECT 1`;
    const count = await database.personalTest.count();
    console.log(`PostgreSQL подключён. Таблица personal_tests доступна, записей: ${count}.`);
} catch {
    console.error(
        'Проверка базы не прошла. Проверь Docker, локальный .env и применённые миграции.',
    );
    process.exitCode = 1;
} finally {
    await database.$disconnect();
}
