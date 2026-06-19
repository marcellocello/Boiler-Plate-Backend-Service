export default async function healthRoutes(fastify) {
    fastify.get('/health', async (request, reply) => {
        return {
            success: true,
            message: 'Service is healthy',
            data: {
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            }
        }
    })
}