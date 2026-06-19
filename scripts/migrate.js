/**
 * Migration CLI
 *
 * Usage:
 *   node --env-file=.env.development scripts/migrate.js postgres
 *   node --env-file=.env.development scripts/migrate.js mysql
 *   node --env-file=.env.development scripts/migrate.js mongo
 *   node --env-file=.env.development scripts/migrate.js all
 *
 * Di package.json (sudah ditambahkan):
 *   npm run migrate:postgres
 *   npm run migrate:mysql
 *   npm run migrate:mongo
 *   npm run migrate:all
 */

import { runPostgresMigrations, runMysqlMigrations, runMongoMigrations } from '../src/migrations/runner.js';
import { config } from '../src/config/env.js';

const target = process.argv[2] || 'all';

async function main() {
    console.log(`[Migration] Env: ${config.app.env}`);
    console.log(`[Migration] Target: ${target}`);
    console.log('');

    try {
        if (target === 'postgres' || target === 'all') {
            if (config.database.postgres.enabled) {
                await runPostgresMigrations();
            } else {
                console.log('[Migration] PostgreSQL: dilewati (DB_POSTGRES=false)');
            }
        }

        if (target === 'mysql' || target === 'all') {
            if (config.database.mysql.enabled) {
                await runMysqlMigrations();
            } else {
                console.log('[Migration] MySQL: dilewati (DB_MYSQL=false)');
            }
        }

        if (target === 'mongo' || target === 'all') {
            if (config.database.mongo.enabled) {
                await runMongoMigrations();
            } else {
                console.log('[Migration] MongoDB: dilewati (DB_MONGO=false)');
            }
        }

        console.log('\n[Migration] Semua migration selesai.');
        process.exit(0);
    } catch (err) {
        console.error('\n[Migration] GAGAL:', err.message);
        process.exit(1);
    }
}

main();