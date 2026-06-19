import { mysqlPool } from './connection.js';

/**
 * ============================================================
 * MySQL Query Helper
 * ============================================================
 * Kumpulan function generic untuk operasi database MySQL.
 *
 * Untuk query kompleks (JOIN, subquery, dll), tetap bisa pakai
 * function `query()` dengan raw SQL.
 * ============================================================
 */

/**
 * Jalankan raw SQL query.
 * @param {string} sql - SQL statement, gunakan `?` untuk placeholder.
 * @param {Array} params - Nilai untuk placeholder.
 * @returns {Promise<Array|Object>} Hasil query.
 *
 * @example
 * const rows = await query('SELECT * FROM users WHERE status = ?', ['active']);
 */
export async function query(sql, params = []) {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
}

/**
 * Ambil satu baris data berdasarkan kondisi tertentu.
 * @param {string} table - Nama tabel.
 * @param {Object} where - Kondisi WHERE, contoh: { id: 1 }.
 * @returns {Promise<Object|null>}
 * 
 * @example
 * const user = await findOne('users', { id: 1 });
 */
export async function findOne(table, where) {
    const keys = Object.keys(where);
    const clause = keys.length ? `WHERE ${keys.map((k) => `${k} = ?`).join(' AND ')}` : '';

    const sql = `SELECT * FROM ${table} ${clause} LIMIT 1`;
    const rows = await query(sql, Object.values(where));
    return rows[0] || null;
}

/**
 * Ambil banyak baris data, mendukung order, limit, offset.
 * @param {string} table - Nama tabel.
 * @param {Object} where - Kondisi WHERE, contoh: { status: 'active' }.
 * @param {Object} options - { orderBy, limit, offset }
 * @returns {Promise<Array>}
 *
 * @example
 * const users = await findMany('users', { status: 'active' }, { orderBy: 'created_at DESC', limit: 10 });
 */
export async function findMany(table, where = {}, options = {}) {
    const keys = Object.keys(where);
    const clause = keys.length ? `WHERE ${keys.map((k) => `${k} = ?`).join(' AND ')}` : '';

    let sql = `SELECT * FROM ${table} ${clause}`;
    if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
    if (options.limit) sql += ` LIMIT ${options.limit}`;
    if (options.offset) sql += ` OFFSET ${options.offset}`;

    return await query(sql, Object.values(where));
}

/**
 * Insert satu baris data baru.
 * @param {string} table - Nama tabel.
 * @param {Object} data - Data yang akan diinsert, contoh: { name: 'John', email: 'a@mail.com' }.
 * @returns {Promise<{ insertId: number, affectedRows: number }>}
 *
 * @example
 * const result = await insert('users', { name: 'John', email: 'a@mail.com' });
 */
export async function insert(table, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})}`;
    const [result] = await mysqlPool.execute(sql, Object.values(data));
    return { insertId: result.insertId, affectedRows: result.affectedRows };
}

/**
 * Update baris data berdasarkan kondisi.
 * @param {string} table - Nama tabel.
 * @param {Object} data - Data yang akan diupdate, contoh: { name: 'Jane' }.
 * @param {Object} where - Kondisi WHERE, contoh: { id: 1 }.
 * @returns {Promise<{ affectedRows: number }>}
 *
 * @example
 * await update('users', { name: 'Jane' }, { id: 1 });
 */
export async function update(table, data, where) {
    const dataKeys = Object.keys(data);
    const whereKeys = Object.keys(where);

    const setClause = dataKeys.map((k) => `${k} = ?`).join(', ');
    const whereClause = whereKeys.map((k) => `${k} = ?`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const [result] = await mysqlPool.execute(sql, [...Object.values(data), ...Object.values(where)]);
    return { affectedRows: result.affectedRows };
}

/**
 * Hapus baris data berdasarkan kondisi tertentu.
 * @param {string} table - Nama tabel.
 * @param {Object} where - Kondisi WHERE, contoh: { id: 1 }.
 * @returns {Promise<{ affectedRows: number }>}
 *
 * @example
 * await remove('users', { id: 1 });
 */
export async function remove(table, where) {
    const keys = Object.keys(where);
    const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const [result] = await mysqlPool.execute(sql, Object.values(where));
    return { affectedRows: result.affectedRows };
}

/**
 * Jalankan beberapa query dalam satu transaction.
 * Otomatis commit jika sukses, rollback jika ada error.
 *
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} callback
 * @returns {Promise<any>}
 *
 * @example
 * await transaction(async (conn) => {
 *   await conn.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [100, 1]);
 *   await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [100, 2]);
 * });
 */
export async function transaction(callback) {
    const conn = await mysqlPool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}