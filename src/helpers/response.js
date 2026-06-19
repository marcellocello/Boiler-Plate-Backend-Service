/**
 * ============================================================
 * Response Helper
 * ============================================================
 * Semua response API harus pakai helper ini agar formatnya
 * konsisten di seluruh endpoint.
 *
 * Format sukses:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... },
 *   "meta": { ... }   // opsional, untuk pagination
 * }
 *
 * Format error (ditangani global error handler di app.js):
 * {
 *   "success": false,
 *   "message": "...",
 *   "code": "...",
 *   "errors": [ ... ]  // opsional, detail validasi
 * }
 * ============================================================
 */
 
/**
 * Response sukses standar.
 * @param {import('fastify').FastifyReply} reply
 * @param {object} options
 * @param {any} options.data - Data yang dikembalikan.
 * @param {string} [options.message] - Pesan sukses.
 * @param {number} [options.statusCode] - HTTP status code (default 200).
 * @param {object} [options.meta] - Metadata tambahan (pagination, dll).
 *
 * @example
 * return sendSuccess(reply, { data: users, message: 'Berhasil mengambil data user' });
 */

export function sendSuccess(reply, { data = null, message = 'Berhasil', statusCode = 200, meta = null } = {}) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return reply.status(statusCode).send(body);
}

/**
 * Response sukses untuk data yang baru dibuat (HTTP 201).
 * @param {import('fastify').FastifyReply} reply
 * @param {object} options
 *
 * @example
 * return sendCreated(reply, { data: newUser, message: 'User berhasil dibuat' });
 */
export function sendCreated(reply, { data = null, message = 'Data berhasil dibuat' } = {}) {
    return sendSuccess(reply, { data, message, statusCode: 201 });
}

/**
 * Response sukses untuk pagination.
 * @param {import('fastify').FastifyReply} reply
 * @param {object} options
 * @param {Array} options.data - Array data.
 * @param {number} options.total - Total semua data (sebelum pagination).
 * @param {number} options.page - Halaman saat ini.
 * @param {number} options.limit - Jumlah data per halaman.
 * @param {string} [options.message]
 *
 * @example
 * return sendPaginated(reply, { data: users, total: 100, page: 1, limit: 10 });
 */
export function sendPaginated(reply, { data = [], total = 0, page = 1, limit = 10, message = 'Berhasil'} = {}) {
    return sendSuccess(reply, {
        data,
        message,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        }
    })
}