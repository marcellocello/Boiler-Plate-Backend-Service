import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

/**
 * Load env file berdasarkan NODE_ENV:
 *      development -> .env.development
 *      staging     -> .env.staging
 *      production  -> .env.production
 * 
 * Prioritas: env var yang sudah ada di sistem (dari PM2/Docker/OS)
 * tidak akan ditimpa -- override: false.
 * 
 * Di server (staging / production), .env.stating / .env.production
 * harus sudah ada di root project sebelum pm2 start.
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = resolve(process.cwd(), `.env.${NODE_ENV}`);

dotenvConfig({ path: envFile, override: false });

export const config = {
    app: {
        env: NODE_ENV,
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || '0.0.0.0',
        logLevel: process.env.LOG_LEVEL || 'info',
    },
    database: {
        mysql: {
            enabled: process.env.DB_MYSQL === 'true',
            host: process.env.MYSQL_HOST || 'localhost',
            port: parseInt(process.env.MYSQL_PORT || '3306', 10),
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'app_db',
        },
        postgres: {
            enabled: process.env.DB_POSTGRES === 'true',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || '',
            database: process.env.POSTGRES_DB || 'app_db',
        },
        mongo: {
            enabled: process.env.DB_MONGO === 'true',
            host: process.env.MONGO_HOST || 'localhost',
            port: parseInt(process.env.MONGO_PORT || '27017', 10),
            user: process.env.MONGO_USER || '',
            password: process.env.MONGO_PASSWORD || '',
            database: process.env.MONGO_DATABASE || 'app_db',
        }
    }
};