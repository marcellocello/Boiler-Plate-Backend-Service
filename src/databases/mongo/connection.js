import { MongoClient } from 'mongodb';
import { config } from '../../config/env.js';

const { host, port, user, password, database: dbName } = config.database.mongo;

const uri =
    user && password
        ? `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?authSource=admin`
        : `mongodb://${host}:${port}/${dbName}`;

export const mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });

let db = null;
let connectingPromise = null;

/**
 * Ambil instance database MongoDB.
 * Koneksi dibuka secara lazy (sekali saja) saat function ini
 * dipanggil pertama kali.
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDb() {
    if (db) return db;

    if (!connectingPromise) {
        connectingPromise = mongoClient.connect().then((client) => {
            db = client.db(dbName);
            return db;
        });
    }

    return connectingPromise;
}

/**
 * Cek koneksi ke MongoDB.
 */
export async function checkMongoConnection() {
    const db = await getDb();
    await db.command({ ping: 1 });
}