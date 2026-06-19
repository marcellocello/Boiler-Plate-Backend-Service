import { checkAllConnections } from '../databases/index.js';

/**
 * Route untuk cek status koneksi ke MySQL, PostgreSQL, dan MongoDB.
 * Berguna untuk debugging saat development & memastikan docker-compose
 * sudah terhubung dengan benar.
 */
export default async function dbStatusRoutes(fastify) {
    fastify.get('/db-status', async () => {
        const status = await checkAllConnections();

        return {
            success: true,
            message: 'Database connection status',
            data: status
        };
    });
}