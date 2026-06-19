/**
 * Generate semua key yang dibutuhkan untuk enkripsi.
 * Jalankan sekali: node scripts/generate-keys.js
 *
 * Output akan dicetak ke terminal dalam format siap paste ke .env
 */

import { generateKeyPairSync, randomBytes } from 'crypto';

console.log('Generating keys...\n');

// ====== RSA 2048-bit Key Pair ======
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// ====== AES & HMAC Keys ======
const dbEncryptionKey = randomBytes(32).toString('hex');
const dbHmacKey       = randomBytes(32).toString('hex');

// Format PEM jadi single line untuk .env (newline → \n literal)
const privatePem = privateKey.replace(/\n/g, '\\n');
const publicPem  = publicKey.replace(/\n/g, '\\n');

console.log('=' .repeat(60));
console.log('Tambahkan baris berikut ke .env.development / .env.staging / .env.production');
console.log('=' .repeat(60));
console.log('');
console.log('# ====== ENCRYPTION KEYS ======');
console.log(`DB_ENCRYPTION_KEY=${dbEncryptionKey}`);
console.log('');
console.log(`DB_HMAC_KEY=${dbHmacKey}`);
console.log('');
console.log(`RSA_PRIVATE_KEY="${privatePem}"`);
console.log('');
console.log(`RSA_PUBLIC_KEY="${publicPem}"`);
console.log('');
console.log('=' .repeat(60));
console.log('PENTING:');
console.log('- Simpan RSA_PRIVATE_KEY dengan aman, jangan share ke siapapun.');
console.log('- DB_ENCRYPTION_KEY hilang = data terenkripsi tidak bisa didekripsi.');
console.log('- Gunakan key berbeda untuk development, staging, dan production.');
console.log('=' .repeat(60));