import { db } from '../databases/index.js';
import { encryptFields, decryptFields, blindIndex } from '../utils/encryption.js';

/**
 * Field yang dienkripsi sebelum masuk database.
 * Masing-masing field akan punya kolom _index untuk exact search.
 *
 * Skema tabel PostgreSQL:
 *   CREATE TABLE users (
 *     id         SERIAL PRIMARY KEY,
 *     name       VARCHAR(100) NOT NULL,
 *     email      TEXT NOT NULL,           -- ciphertext
 *     email_index VARCHAR(64) NOT NULL UNIQUE, -- HMAC untuk search
 *     phone      TEXT,                    -- ciphertext
 *     phone_index VARCHAR(64),            -- HMAC untuk search
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 */
const ENCRYPTED_FIELDS = ['email', 'phone'];

function encryptUser(data) {
  return encryptFields(data, ENCRYPTED_FIELDS);
}

function decryptUser(row) {
  return decryptFields(row, ENCRYPTED_FIELDS);
}

export async function findAll({ limit, offset, orderBy = 'created_at DESC' }) {
  const rows = await db.postgres.findMany('users', {}, { limit, offset, orderBy });
  return rows.map(decryptUser);
}

export async function countAll() {
  const result = await db.postgres.query('SELECT COUNT(*)::int as total FROM users');
  return result[0].total;
}

export async function findById(id) {
  const row = await db.postgres.findOne('users', { id });
  return decryptUser(row);
}

export async function findByEmail(email) {
  const index = blindIndex(email);
  const row   = await db.postgres.findOne('users', { email_index: index });
  return decryptUser(row);
}

export async function findByPhone(phone) {
  const index = blindIndex(phone);
  const row   = await db.postgres.findOne('users', { phone_index: index });
  return decryptUser(row);
}

export async function create(data) {
  const encrypted = encryptUser(data);
  return decryptUser(
    await db.postgres.insert('users', {
      ...encrypted,
      created_at: new Date(),
      updated_at: new Date(),
    })
  );
}

export async function update(id, data) {
  const encrypted = encryptFields(data, ENCRYPTED_FIELDS.filter((f) => data[f] !== undefined));
  const rows      = await db.postgres.update(
    'users',
    { ...encrypted, updated_at: new Date() },
    { id }
  );
  return decryptUser(rows[0]);
}

export async function remove(id) {
  return db.postgres.remove('users', { id });
}