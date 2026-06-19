import { mysqlPool, checkMysqlConnection } from './mysql/connection.js';
import { pgPool, checkPostgresConnection } from './postgres/connection.js';
import { mongoClient, checkMongoConnection } from './mongo/connection.js';
import { config } from '../config/env.js';

import * as mysql from './mysql/query.js';
import * as postgres from './postgres/query.js';
import * as mongo from './mongo/query.js';

/**
 * ============================================================
 * Database Entry Point
 * ============================================================
 * Import object `db` ini di mana pun butuh akses database.
 * 
 * Aktifkan database di .env dengan flag:
 *      DB_MYSQL=true
 *      DB_POSTGRES=true
 *      DB_MONGO=true
 * 
 * Hanya database yang diaktifkan yang akan connect.
 *
 * @example
 * import { db } from '../databases/index.js';
 *
 * const users = await db.mysql.findMany('users', { status: 'active' });
 * const order  = await db.postgres.findOne('orders', { id: 1 });
 * const log    = await db.mongo.insertOne('logs', { msg: 'hello' });
 * ============================================================
 */
export const db = {
    mysql,
    postgres,
    mongo,
};

/**
 * Cek status koneksi ke semua database sekaligus.
 * Tidak melempar error - setiap database dicek secara independen.
 * @returns {Promise<{ mysql: string, postgres: string, mongo: string }>}
 */
export async function checkAllConnections() {
    const result = {};
    const checks = [];

    if (config.database.mysql.enabled) {
        checks.push(
            checkMysqlConnection()
                .then(() => (result.mysql = 'connected'))
                .catch((err) => (result.mysql = {
                    status: 'error',
                    message: err.message || String(err),
                    code: err.code,
                }))
        );
    } else {
        result.mysql = { status: 'disabled' };
    }

    if (config.database.postgres.enabled) {
        checks.push(
            checkPostgresConnection()
                .then(() => (result.postgres = 'connected'))
                .catch((err) => (result.postgres = {
                    status: 'error',
                    message: err.message || String(err),
                    code: err.code,
                }))
        );
    } else {
        result.postgres = { status: 'disabled' };
    }

    if (config.database.mongo.enabled) {
        checks.push(
            checkMongoConnection()
                .then(() => (result.mongo = 'connected'))
                .catch((err) => (result.mongo = {
                    status: 'error',
                    message: err.message || String(err),
                    code: err.code,
                }))
        );
    } else {
        result.mongo = { status: 'disabled' };
    }

    await Promise.all(checks);
    return result;
}

/**
 * Tutup semua koneksi database dengan rapi.
 * Dipanggil saat proses shutdown (SIGINT/SIGTERM).
 */
export async function closeDatabases() {
    await Promise.all([
        mysqlPool ? mysqlPool.end().catch(() => {}) : Promise.resolve(),
        pgPool ? pgPool.end().catch(() => {}) : Promise.resolve(),
        mongoClient ? mongoClient.close().catch(() => {}) : Promise.resolve(),
    ]);
}