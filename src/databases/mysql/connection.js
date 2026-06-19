import mysql from 'mysql2/promise';
import { config } from '../../config/env.js';

/**
 * Connection pool MySQL.
 * Pool dibuat sekali saat module di-load, koneksi aktual baru dibuka
 * ketika ada query pertama kali (lazy).
 */

export const mysqlPool = mysql.createPool({
    host: config.database.mysql.host,
    user: config.database.mysql.user,
    password: config.database.mysql.password,
    database: config.database.mysql.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

export async function checkMysqlConnection() {
    const conn = await mysqlPool.getConnection();
    try {
        await conn.ping();
    } catch (err) {
        conn.release();
    }
}