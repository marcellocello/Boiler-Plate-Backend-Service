# App Backend Service

App backend service.

**Stack:** Node.js 24 · Fastify · MySQL · PostgreSQL · MongoDB · PM2

---

## Quick Start (Development)

```bash
# 1. Pastikan versi Node.js sesuai
nvm use

# 2. Install dependencies
npm install

# 3. Copy dan sesuaikan env development
cp .env.development .env.development.local  # opsional untuk override
# Edit .env.development — aktifkan DB yang dipakai (DB_MYSQL/DB_POSTGRES/DB_MONGO=true)

# 4. Jalankan database via Docker
docker compose --profile postgres up -d          # PostgreSQL saja
docker compose --profile mysql up -d             # MySQL saja
docker compose --profile mongo up -d             # MongoDB saja
docker compose --profile mysql --profile mongo up -d  # kombinasi

# 5. Jalankan app
npm run dev

# 6. Cek koneksi database
open http://localhost:3000/api/db-status
```

---

## Struktur Project

```
src/
├── config/
│   └── env.js              # Load .env.{NODE_ENV}, config terpusat
├── databases/
│   ├── mysql/
│   │   ├── connection.js   # Pool koneksi MySQL
│   │   └── query.js        # Helper: query, findOne, findMany, insert, update, remove, transaction
│   ├── postgres/
│   │   ├── connection.js   # Pool koneksi PostgreSQL
│   │   └── query.js        # Helper: query, findOne, findMany, insert, update, remove, transaction
│   ├── mongo/
│   │   ├── connection.js   # Client koneksi MongoDB
│   │   └── query.js        # Helper: findOne, findMany, insertOne, updateOne, deleteOne, aggregate
│   └── index.js            # Entry point: import { db } dari sini
├── routes/
│   ├── root.route.js
│   ├── health.route.js
│   └── db-status.route.js
├── app.js                  # Builder Fastify
└── server.js               # Entry point HTTP server
```

---

## Pakai Query Helper

```js
import { db } from '../databases/index.js';

// MySQL
const users   = await db.mysql.findMany('users', { status: 'active' });
const user    = await db.mysql.findOne('users', { id: 1 });
const result  = await db.mysql.insert('users', { name: 'John', email: 'a@mail.com' });
await db.mysql.update('users', { name: 'Jane' }, { id: 1 });
await db.mysql.remove('users', { id: 1 });
await db.mysql.transaction(async (conn) => {
  await conn.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [100, 1]);
  await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [100, 2]);
});

// PostgreSQL — API sama, placeholder $1 $2 otomatis
const orders  = await db.postgres.findMany('orders', { status: 'pending' });
const order   = await db.postgres.insert('orders', { user_id: 1, total: 50000 });

// MongoDB
const logs    = await db.mongo.findMany('logs', { level: 'error' }, { sort: { createdAt: -1 }, limit: 10 });
const log     = await db.mongo.insertOne('logs', { level: 'info', msg: 'hello' });
await db.mongo.updateOne('logs', { _id: new db.mongo.ObjectId(id) }, { msg: 'updated' });
```

---

## Deploy (Staging / Production)

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap.

```bash
# Staging
pm2 start ecosystem.config.cjs --env staging

# Production
pm2 start ecosystem.config.cjs --env production

# Deploy ulang
git pull && npm install --omit=dev && pm2 reload ecosystem.config.cjs --env production
```