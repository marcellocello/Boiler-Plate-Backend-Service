import { getPublicKeyPem } from '../utils/rsa.js';

/**
 * Security Routes
 *
 * GET /api/security/public-key
 *   Return RSA public key server dalam format PEM.
 *   Client (Flutter) fetch endpoint ini sekali saat app start,
 *   lalu gunakan public key untuk enkripsi AES session key
 *   pada setiap request selanjutnya.
 *
 * Endpoint ini sengaja tidak dienkripsi (tidak butuh auth)
 * karena public key memang boleh diketahui siapapun.
 */
export default async function securityRoutes(fastify) {
    fastify.get('/public-key', async (request, reply) => {
        return reply.send({
            success: true,
            message: 'Berhasil mengambil public key',
            code: 'OK',
            data: {
                publicKey: getPublicKeyPem(),
                algorithm: 'RSA-OAEP',
                keySize: 2048,
                encryption: 'AES-256-GCM',
            },
        });
    });
}