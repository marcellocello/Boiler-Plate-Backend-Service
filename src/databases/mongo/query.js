import { ObjectId } from 'mongodb';
import { getDb } from './connection.js';

/**
 * ============================================================
 * MongoDB Query Helper
 * ============================================================
 * Kumpulan function generic untuk operasi CRUD ke collection
 * MongoDB. Untuk operasi lanjutan (lookup, group, dll) gunakan
 * `aggregate()` dengan pipeline custom.
 * ============================================================
 */

async function collection(name) {
  const db = await getDb();
  return db.collection(name);
}

/**
 * Ambil satu document.
 * @param {string} collectionName
 * @param {Object} filter - contoh: { email: 'a@mail.com' }
 * @returns {Promise<Object|null>}
 *
 * @example
 * const user = await findOne('users', { email: 'a@mail.com' });
 */
export async function findOne(collectionName, filter = {}) {
  const col = await collection(collectionName);
  return col.findOne(filter);
}

/**
 * Ambil banyak document, mendukung sort, limit, skip.
 * @param {string} collectionName
 * @param {Object} filter - contoh: { status: 'active' }
 * @param {Object} options - { sort, limit, skip }
 * @returns {Promise<Array>}
 *
 * @example
 * const users = await findMany('users', { status: 'active' }, { sort: { createdAt: -1 }, limit: 10 });
 */
export async function findMany(collectionName, filter = {}, options = {}) {
  const col = await collection(collectionName);
  let cursor = col.find(filter);

  if (options.sort) cursor = cursor.sort(options.sort);
  if (options.skip) cursor = cursor.skip(options.skip);
  if (options.limit) cursor = cursor.limit(options.limit);

  return cursor.toArray();
}

/**
 * Insert satu document baru.
 * @param {string} collectionName
 * @param {Object} data
 * @returns {Promise<Object>} Document yang baru dibuat (termasuk _id).
 *
 * @example
 * const user = await insertOne('users', { name: 'John', email: 'a@mail.com' });
 */
export async function insertOne(collectionName, data) {
  const col = await collection(collectionName);
  const result = await col.insertOne(data);
  return { _id: result.insertedId, ...data };
}

/**
 * Insert banyak document sekaligus.
 * @param {string} collectionName
 * @param {Array<Object>} dataArray
 * @returns {Promise<{ insertedCount: number, insertedIds: Object }>}
 *
 * @example
 * await insertMany('logs', [{ msg: 'a' }, { msg: 'b' }]);
 */
export async function insertMany(collectionName, dataArray) {
  const col = await collection(collectionName);
  const result = await col.insertMany(dataArray);
  return { insertedCount: result.insertedCount, insertedIds: result.insertedIds };
}

/**
 * Update satu document (otomatis dibungkus dengan operator `$set`).
 * @param {string} collectionName
 * @param {Object} filter - contoh: { _id: new ObjectId(id) }
 * @param {Object} data - field yang akan diupdate, contoh: { name: 'Jane' }
 * @returns {Promise<{ matchedCount: number, modifiedCount: number }>}
 *
 * @example
 * await updateOne('users', { _id: new ObjectId(id) }, { name: 'Jane' });
 */
export async function updateOne(collectionName, filter, data) {
  const col = await collection(collectionName);
  const result = await col.updateOne(filter, { $set: data });
  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
}

/**
 * Hapus satu document.
 * @param {string} collectionName
 * @param {Object} filter - contoh: { _id: new ObjectId(id) }
 * @returns {Promise<{ deletedCount: number }>}
 *
 * @example
 * await deleteOne('users', { _id: new ObjectId(id) });
 */
export async function deleteOne(collectionName, filter) {
  const col = await collection(collectionName);
  const result = await col.deleteOne(filter);
  return { deletedCount: result.deletedCount };
}

/**
 * Jalankan aggregation pipeline.
 * @param {string} collectionName
 * @param {Array} pipeline - contoh: [{ $match: { status: 'active' } }, { $group: {...} }]
 * @returns {Promise<Array>}
 *
 * @example
 * const result = await aggregate('orders', [
 *   { $match: { status: 'paid' } },
 *   { $group: { _id: '$userId', total: { $sum: '$amount' } } },
 * ]);
 */
export async function aggregate(collectionName, pipeline = []) {
  const col = await collection(collectionName);
  return col.aggregate(pipeline).toArray();
}

// Re-export ObjectId supaya tidak perlu install/import ulang `mongodb` di service lain.
export { ObjectId };