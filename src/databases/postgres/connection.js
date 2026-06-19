import pg from 'pg';
import { config } from '../../config/env.js';

const { Pool } = pg;
const { host, port, user, password, database: dbName } = config.database.postgres;

/**
 * Connection pool PostgreSQL.
 * Koneksi aktual baru dibuka saat query pertama.
 */
export const pgPool = new Pool({
    host: host,
    port: port,
    user: user,
    password: password,
    database: dbName,
    max: 10,
    connectionTimeoutMillis: 5000
});

/**
 * Cek koneksi ke PostgeSQL
 */
export async function checkPostgresConnection() {
    const client = await pgPool.connect();
    try {
        await client.query('SELECT 1');
    } finally {
        client.release();
    }
}