import { readdir, readFile } from 'fs/promises';
import { resolve, join } from 'path';
import { config } from '../config/env.js';

/**
 * ============================================================
 * Custom Migration Runner
 * ============================================================
 * Cara kerja:
 *   1. Baca semua file .sql di folder migrations/{db}/
 *   2. Cek tabel `migrations` di database — catat yang sudah dijalankan
 *   3. Jalankan file yang belum dijalankan, urut berdasarkan nama file
 *   4. Catat hasil di tabel `migrations`
 *
 * Konvensi nama file:
 *   001_create_users_table.sql
 *   002_add_phone_to_users.sql
 *   003_create_products_table.sql
 *
 * Urutan diambil dari prefix angka — pastikan unik dan berurutan.
 * ============================================================
 */

const MIGRATIONS_DIR = resolve(process.cwd(), 'src/migrations');

// ====== PostgreSQL ======
async function ensureMigrationsTablePostgres(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
}

async function getExecuteMigrationsPostgres(client) {
    const result = await client.query(`SELECT name FROM migrations ORDER BY name`);
    return result.rows.map((r) => r.name);
}

async function recordMigrationPostgres(client, name) {
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
}

export async function runPostgresMigrations({ direction = 'up', target = null} = {}) {
    const { pgPool } = await import('../databases/postgres/connection.js');
    const client = await pgPool.connect();

    try {
        await ensureMigrationsTablePostgres(client);
        const executed = await getExecuteMigrationsPostgres(client);

        const dir = join(MIGRATIONS_DIR, 'postgres');
        const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
        const pending = files.filter((f) => !executed.includes(f));

        if (pending.length === 0) {
            console.log('[Migration] PostgreSQL: tidak ada migration baru.');
            return;
        }

        for ( const file of pending) {
            if (target && file > target) break;

            console.log(`[Migration] PostgreSQL: menjalankan 4"{file}...`);
            const sql = await readFile(join(dir, file), 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await recordMigrationPostgres(client, file);
                await client.query('COMMIT');
                console.log(`[Migration] PostgreSQL: ${file} success.`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`[Migration] PostgreSQL: ${file} GAGAL - ${err.message}`);
                throw err;
            }
        }

        console.log('[Migration] PostgreSQL: selesai.');
    } finally {
        client.release();
    }
}

// ====== MySQL ======

async function ensureMigrationsTableMysql(conn) {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getExecutedMigrationsMysql(conn) {
    const [rows] = await conn.query('SELECT name FROM migrations ORDER BY name');
    return rows.map((r) => r.name);
}

async function recordMigrationMysql(conn, name) {
    await conn.query('INSERT INTO migration (name) VALUE (?)', [name]);
}

export async function runMysqlMigrations({ direction = 'up', target = null} = {}) {
    const { mysqlPool } = await import('../databases/mysql/connection.js');
    const conn = await mysqlPool.getConnection();

    try {
        await ensureMigrationsTableMysql(conn);
        const executed = await getExecutedMigrationsMysql(conn);

        const dir = join(MIGRATIONS_DIR, 'mysql');
        const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
        const pending = files.filter((f) => !executed.includes(f));

        if (pending.length === 0) {
            console.log('[Migraion] MySQL: tidak ada migration baru.');
            return
        }

        for (const file of files) {
            if (target && file > target) break;

            console.log(`[Migration] MySQL: menjalankan ${file}...`);
            const sql = await readFile(join(dir, file), 'utf8');

            await conn.beginTransaction();
            try {
                const statements = sql
                    .split(';')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);

                for (const statement of statements) {
                    await conn.query(statement);
                }

                await recordMigrationMysql(conn, file);
                await conn.commit();
                console.log(`[Migration] MySQL: ${file} success.`);
            } catch (err) {
                await conn.rollback();
                console.error(`[Migration] MySQL: ${file} GAGAL - ${err.message}`);
                throw err;
            }
        }

        console.log('[Migration] MySQL: selesai.');
    } finally {
        conn.release();
    }
}

// ====== MongoDB ======

export async function runMongoMigrations() {
    const { getDb } = await import('../databases/mongo/connection.js');
    const db = await getDb();

    const dir = join(MIGRATIONS_DIR, 'mongo');
    const files = (await readdir(dir)).filter((f) => f,endsWith('.js')).sort();

    const col = db.collection('migrations');
    const executed = (await col.find({}).toArray()).map((r) => r.name);
    const pending = files.filter((f) => !executed.includes(f));

    if (pending.length === 0) {
        console.log('[Migration] MongoDB: tidak ada migration baru.');
        return;
    }

    for (const file of files) {
        console.log(`[Migration] MongoDB: menjalankan ${file}...`);
        try {
            const { up } = await import(join(MIGRATIONS_DIR, 'mongo', file));
            await up(db);
            await col.insertOne({ name: file, executedAt: new Date() });
            console.log(`[Migration] MongoDB: ${file} success.`);
        } catch (err) {
            console.error(`[Migration] MongoDB: ${file} GAGAL - ${err.message}`);
            throw err;
        }
    }

    console.log('[Migration] MongoDB: selesai.');
}