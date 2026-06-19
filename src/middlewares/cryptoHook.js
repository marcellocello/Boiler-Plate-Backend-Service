import { decryptPayload, encryptPayload } from '../utils/rsa.js';

/**
 * ============================================================
 * Crypto Hook — Fastify Plugin
 * ============================================================
 * Mendekripsi semua request body sebelum masuk ke route handler,
 * dan mengenkripsi semua response sebelum dikirim ke client.
 *
 * Skip enkripsi untuk:
 *   - GET /api/security/public-key  (client butuh key ini dulu)
 *   - GET /api/health               (monitoring)
 *   - GET /api/db-status            (internal)
 *   - GET /                         (root info)
 *
 * Request yang masuk harus dalam format:
 *   { encryptedKey, iv, authTag, data }
 *
 * Response yang keluar akan dalam format:
 *   { success, message, code, encryptedKey, iv, authTag, data }
 * ============================================================
 */

const SKIP_ROUTES = [
  '/api/security/public-key',
  '/api/health',
  '/api/db-status',
  '/',
];

function shouldSkip(url, method) {
  if (method === 'GET' && SKIP_ROUTES.some((r) => url === r || url.startsWith(r + '?'))) {
    return true;
  }
  return false;
}

export default async function cryptoHook(fastify) {
  /**
   * preHandler — dekripsi request body sebelum masuk route handler.
   * Session key disimpan di request object untuk dipakai saat enkripsi response.
   */
  fastify.addHook('preHandler', async (request, reply) => {
    if (shouldSkip(request.url, request.method)) return;
    if (!request.body || Object.keys(request.body).length === 0) return;

    try {
      const { plaintext, sessionKey } = decryptPayload(request.body);
      request.body       = plaintext;
      request.sessionKey = sessionKey;
    } catch (err) {
      return reply.status(400).send({
        success: false,
        message: 'Dekripsi request gagal. Pastikan payload terenkripsi dengan benar.',
        code: 'DECRYPTION_FAILED',
      });
    }
  });

  /**
   * onSend — enkripsi response sebelum dikirim ke client.
   * Hanya enkripsi kalau response sukses (bukan error 4xx/5xx tanpa session key).
   */
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (shouldSkip(request.url, request.method)) return payload;
    if (!request.sessionKey) return payload;

    try {
      const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const { success, message, code, ...rest } = parsedPayload;
      const encrypted = encryptPayload(parsedPayload, request.sessionKey);

      const response = {
        success:      success ?? true,
        message:      message ?? 'Berhasil',
        code:         code ?? 'OK',
        encryptedKey: encrypted.encryptedKey,
        iv:           encrypted.iv,
        authTag:      encrypted.authTag,
        data:         encrypted.data,
      };

      return JSON.stringify(response);
    } catch (err) {
      request.log.error('Enkripsi response gagal:', err.message);
      return payload;
    }
  });
}