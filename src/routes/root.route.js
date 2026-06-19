export default async function rootRoutes(fastify) {
    fastify.get('/', async (request, reply) => {
        return {
            success: true,
            message: 'App Backend Service is running',
        }
    })
}