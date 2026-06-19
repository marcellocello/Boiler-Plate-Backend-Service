import {
  publicEncrypt,
  privateDecrypt,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  constants,
} from 'crypto';

/**
 * ============================================================
 * RSA + AES-256-GCM Hybrid Encryption
 * ============================================================
 * Dipakai untuk enkripsi request/response body antara
 * server dan client (Flutter).
 *
 * Flow enkripsi (client → server):
 *   1. Client generate AES session key (32 bytes random)
 *   2. Encrypt body JSON pakai AES-256-GCM → { iv, authTag, data }
 *   3. Encrypt AES session key pakai RSA public key → encryptedKey
 *   4. Kirim semua dalam satu payload
 *
 * Flow dekripsi (server):
 *   1. Decrypt encryptedKey pakai RSA private key → AES session key
 *   2. Decrypt data pakai AES session key → body JSON
 *
 * Env var yang dibutuhkan:
 *   RSA_PRIVATE_KEY = PEM string private key
 *   RSA_PUBLIC_KEY  = PEM string public key
 *
 * Generate key pair:
 *   node scripts/generate-keys.js
 * ============================================================
 */

function getPrivateKey() {
  const key = process.env.RSA_PRIVATE_KEY;
  if (!key) throw new Error('RSA_PRIVATE_KEY tidak ditemukan di env. Jalankan: node scripts/generate-keys.js');
  return key.replace(/\\n/g, '\n'); // handle newline yang di-escape di env
}

function getPublicKey() {
  const key = process.env.RSA_PUBLIC_KEY;
  if (!key) throw new Error('RSA_PUBLIC_KEY tidak ditemukan di env. Jalankan: node scripts/generate-keys.js');
  return key.replace(/\\n/g, '\n');
}

/**
 * Enkripsi data (object/string) untuk dikirim ke client.
 * Menggunakan AES session key yang di-share via RSA.
 *
 * @param {Object|string} data — data yang akan dienkripsi
 * @param {Buffer} [sessionKey] — gunakan session key yang sudah ada (dari request)
 * @returns {{ encryptedKey: string, iv: string, authTag: string, data: string }}
 */
export function encryptPayload(data, sessionKey = null) {
  const key = sessionKey || randomBytes(32);
  const iv  = randomBytes(12);

  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);

  const cipher    = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const encryptedKey = publicEncrypt(
    { key: getPublicKey(), padding: constants.RSA_PKCS1_OAEP_PADDING },
    key
  );

  return {
    encryptedKey: encryptedKey.toString('base64'),
    iv:           iv.toString('base64'),
    authTag:      authTag.toString('base64'),
    data:         encrypted.toString('base64'),
  };
}

/**
 * Dekripsi payload terenkripsi dari client.
 *
 * @param {{ encryptedKey: string, iv: string, authTag: string, data: string }} payload
 * @returns {{ plaintext: Object, sessionKey: Buffer }}
 *   sessionKey dikembalikan agar bisa dipakai untuk enkripsi response
 */
export function decryptPayload(payload) {
  const { encryptedKey, iv, authTag, data } = payload;

  if (!encryptedKey || !iv || !authTag || !data) {
    throw new Error('Payload tidak lengkap: encryptedKey, iv, authTag, data wajib ada');
  }

  const sessionKey = privateDecrypt(
    { key: getPrivateKey(), padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(encryptedKey, 'base64')
  );

  const decipher = createDecipheriv(
    'aes-256-gcm',
    sessionKey,
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ]).toString('utf8');

  let plaintext;
  try {
    plaintext = JSON.parse(decrypted);
  } catch {
    plaintext = decrypted;
  }

  return { plaintext, sessionKey };
}

/**
 * Return public key server dalam format PEM.
 * Untuk endpoint GET /api/security/public-key.
 */
export function getPublicKeyPem() {
  return getPublicKey();
}