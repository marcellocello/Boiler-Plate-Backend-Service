import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

/**
 * ============================================================
 * AES-256-GCM Encryption Utility
 * ============================================================
 * Dipakai untuk enkripsi field sensitif di database.
 *
 * Format ciphertext yang disimpan di DB:
 *   "iv:authTag:ciphertext" (semua base64, dipisah titik dua)
 *
 * Env var yang dibutuhkan:
 *   DB_ENCRYPTION_KEY = 64 karakter hex (32 bytes)
 *   DB_HMAC_KEY       = 64 karakter hex (32 bytes) — untuk blind index
 *
 * Generate key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * ============================================================
 */

function getEncryptionKey() {
    const key = process.env.DB_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error('DB_ENCRYPTION_KEY harus 64 karakter hex (32 bytes). Jalankan: node scripts/generate-keys.js');
    }
    return Buffer.from(key, 'hex');
}

function getHmacKey() {
    const key = process.env.DB_HMAC_KEY;
    if (!key || key.length !== 64) {
        throw new Error('DB_HMAC_KEY harus 64 karakter (32 bytes). Jalankan: node scripts/generate-keys.js');
    }
    return key;
}

/**
 * Enkripsi string dengan AES-256-GCM.
 * @param {string} plaintext
 * @returns {string} "iv:authTag:ciphertext" dalam base64
 */
export function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) return null;

    const key = getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64'),
    ].join(':');
}

/**
 * Dekripsi string hasil encrypt().
 * @param {string} ciphertext — format "iv:authTag:ciphertext"
 * @returns {string} plaintext asli
 */
export function decrypt(ciphertext) {
    if (ciphertext === null || ciphertext === undefined) return null;

    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
        throw new Error('Format ciphertext tidak valid');
    }

    const [ivB64, authTagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(data),
        decipher.final(),
    ]).toString('utf8');
}

/**
 * Buat blind index dari nilai plaintext menggunakan HMAC-SHA256.
 * Dipakai untuk exact search pada field terenkripsi.
 *
 * @param {string} value — nilai plaintext (akan di-lowercase & di-trim)
 * @returns {string} HMAC hex string
 *
 * @example
 * // Simpan ke DB: email_index = blindIndex(email)
 * // Search: WHERE email_index = blindIndex(inputEmail)
 */
export function blindIndex(value) {
    if (value === null || value === undefined) return null;

    return createHmac('sha256', getHmacKey())
        .update(String(value).toLowerCase().trim())
        .digest('hex');
}

/**
 * Enkripsi beberapa field sekaligus dari sebuah object.
 * @param {Object} data — object data
 * @param {string[]} fields — nama field yang akan dienkripsi
 * @returns {Object} object baru dengan field terenkripsi + blind index
 *
 * @example
 * const encrypted = encryptFields(
 *   { name: 'John', email: 'john@mail.com', phone: '081234' },
 *   ['email', 'phone']
 * );
 * // hasil: { name: 'John', email: 'iv:tag:cipher', email_index: 'hmac...', phone: '...', phone_index: '...' }
 */
export function encryptFields(data, fields) {
    const result = { ...data };
    for (const field of fields) {
        if (result[field] !== undefined) {
            result[`${field}_index`] = blindIndex(result[field]);
            result[field] = encrypt(result[field]);
        }
    }

    return result;
}

/**
 * Dekripsi beberapa field dari sebuah object.
 * @param {Object} data — object dari database
 * @param {string[]} fields — nama field yang akan didekripsi
 * @returns {Object} object baru dengan field terdekripsi, kolom _index dihapus
 *
 * @example
 * const decrypted = decryptFields(rowFromDb, ['email', 'phone']);
 */
export function decryptFields(data, fields) {
    if (!data) return null;
    const result = { ...data };
    for (const field of fields) {
        if (result[field] !== undefined) {
            result[field] = decrypt(result[field]);
        }
        delete result[`${field}_index`];
    }
    return result;
}