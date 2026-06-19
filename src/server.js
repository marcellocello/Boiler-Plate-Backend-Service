import { buildApp } from './app.js';
import { config } from './config/env.js';
import { closeDatabases } from './databases/index.js';

const app = buildApp();

const start = async () => {
    try {
        await app.listen({ port: config.app.port, host: config.app.host });
        app.log.info(`Server running at http://${config.app.host}:${config.app.port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

const shutdown = async (signal) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await closeDatabases();
    process.exit(0);
}

process.on('SIGNINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();