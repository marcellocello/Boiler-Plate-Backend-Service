import { pgPool } from './connection.js';

/**
 * ============================================================
 * PostgreSQL Query Helper
 * ============================================================
 * Perbedaan utama dengan MySQL: placeholder pakai $1, $2, ... dan
 * insert/update mengembalikan baris hasil (RETURNING *).
 * ============================================================
 */

/**
 * Jalankan raw SQL query.
 * @param {string} text - SQL statement, gunakan `$1, $2, ...` untuk placeholder.
 * @param {Array} params - Nilai untuk placeholder.
 * @returns {Promise<Array>} Baris hasil query.
 *
 * @example
 * const rows = await query('SELECT * FROM users WHERE status = $1', ['active']);
 */
export async function query(text, params = []) {
    const result = await pgPool.query(text, params);
    return result.rows;
}

/**
 * Ambil satu baris data berdasarkan kondisi tertentu.
 * @param {string} table - Nama tabel.
 * @param {Object} where - Kondisi WHERE, contoh: { id: 1 }.
 * @returns {Promise<Object|null>}
 *
 * @example
 * const user = await findOne('users', { email: 'a@mail.com' });
 */
export async function findOne(tabel, where = {}) {
    const keys = Object.values(where);
    const clause = keys.length
        ? `WHERE ${keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')}`
        : '';

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
    const clause = keys.length
        ? `WHERE ${keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')}`
        : '';

    let sql = `SELECT * FROM ${table} ${clause}`;
    if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
    if (options.limit) sql += ` LIMIT ${Number(options.limit)}`;
    if (options.offset) sql += ` OFFSET ${Number(options.offset)}`;

    return query(sql, Object.values(where));
}

/**
 * Insert satu baris data baru. Mengembalikan baris yang baru dibuat.
 * @param {string} table - Nama tabel.
 * @param {Object} data - Data yang akan diinsert, contoh: { name: 'John', email: 'a@mail.com' }.
 * @returns {Promise<Object>} Baris yang baru diinsert.
 *
 * @example
 * const user = await insert('users', { name: 'John', email: 'a@mail.com' });
 */
export async function insert(table, data) {
    const keys = Object.values(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const rows = await query(sql, values);
    return rows[0];
}

/**
 * Update baris data berdasarkan kondisi tertentu. Mengembalikan baris yang berhasil diupdate.
 * @param {string} table - Nama tabel.
 * @param {Object} data - Data yang akan diupdate, contoh: { name: 'Jane' }.
 * @param {Object} where - Kondisi WHERE, contoh: { id: 1 }.
 * @returns {Promise<Array>} Baris-baris yang berhasil diupdate.
 *
 * @example
 * await update('users', { name: 'Jane' }, { id: 1 });
 */
export async function update(table, data, where) {
    const dataKeys = Object.values(data);
    const whereKeys = Object.values(where);

    const setClause = dataKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const whereClause = whereKeys
        .map((k, i) => `${k} = $${dataKeys.length + i + 1}`)
        .join(' AND ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    return query(sql, [...Object.values(data), ...Object.values(where)]);
}

/**
 * Hapus baris data berdasarkan kondisi tertentu.
 * @param {string} table - Nama tabel.
 * @param {Object} where - Kondisi WHERE, contoh: { id: 1 }.
 * @returns {Promise<{ rowCount: number }>}
 *
 * @example
 * await remove('users', { id: 1 });
 */
export async function remove(table, where) {
    const keys = Object.values(where);
    const whereClause = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');

    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const result = await pgPool.query(sql, Object.values(where));
    return { rowCount: result.rowCount };
}

/**
 * Jalankan beberapa query dalam satu transaction.
 * Otomatis COMMIT jika sukses, ROLLBACK jika ada error.
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 * @returns {Promise<any>}
 *
 * @example
 * await transaction(async (client) => {
 *   await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, 1]);
 *   await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, 2]);
 * });
 */
export async function transaction(callback) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}