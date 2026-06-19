/**
 * Migration: 001_create_users_indexes.js
 * Buat index untuk collection users di MongoDB.
 * 
 * MongoDB tidak butuh CREATE TABLE -- collection dibuat otomatis.
 * Migration di sini untuk buat index dan constraint.
 */

export async function up(db) {
    const col = db.collection('users');

    // Unique index untuk blind index email dan phone
    await col.createIndex({ email_index: 1 }, { unique: true, sparse: false });
    await col.createIndex({ phone_index: 1 }, { unique: true, sparse: false });

    // Index untuk sorting
    await col.createIndex({ created_at: -1 });
}