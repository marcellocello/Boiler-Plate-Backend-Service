import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env.js';
import { AppError, ValidationError } from './errors/AppError.js';
import cryptoHook from './middlewares/cryptoHook.js';

import rootRoutes    from './routes/root.route.js';
import healthRoutes  from './routes/health.route.js';
import dbStatusRoutes from './routes/db-status.route.js';
import securityRoutes from './routes/security.route.js';

import userRoutes from './routes/user.route.js';

export function buildApp() {
    const app = Fastify({
        logger: {
        level: config.app.logLevel,
        transport:
            config.app.env === 'development'
                ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
                : undefined,
        },
    });

    app.register(cors, { origin: true });

    app.register(cryptoHook);

    app.register(rootRoutes);
    app.register(healthRoutes,   { prefix: '/api' });
    app.register(dbStatusRoutes, { prefix: '/api' });
    app.register(securityRoutes, { prefix: '/api/security' });

    app.register(userRoutes, { prefix: '/api/users' });

    app.setErrorHandler((error, request, reply) => {
        if (error.validation) {
            const details = error.validation.map((v) => ({
                field:   v.instancePath?.replace('/', '') || v.params?.missingProperty || 'unknown',
                message: v.message,
            }));
            return reply.status(400).send({
                success: false,
                message: 'Validasi gagal',
                code:    'VALIDATION_ERROR',
                errors:  details,
            });
        }

        if (error instanceof AppError) {
            const body = {
                success: false,
                message: error.message,
                code:    error.code,
            };
            if (error instanceof ValidationError && error.details) {
                body.errors = error.details;
            }
            return reply.status(error.statusCode).send(body);
        }

        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: config.app.env === 'production'
                ? 'Terjadi kesalahan pada server'
                : error.message,
            code: 'INTERNAL_SERVER_ERROR',
        });
    });

    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            success: false,
            message: `Route ${request.method} ${request.url} tidak ditemukan`,
            code:    'NOT_FOUND',
        });
    });

    return app;
}