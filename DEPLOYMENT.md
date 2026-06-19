# Panduan Deployment

## Development (laptop)

### Setup pertama kali
```bash
# 1. Pastikan versi Node.js sesuai
nvm use       # baca dari .nvmrc otomatis

# 2. Install dependencies
npm install

# 3. Copy env development
cp .env.development .env.development.local  # opsional, kalau mau override nilai
# atau langsung edit .env.development sesuai credential lokal

# 4. Jalankan database via Docker sesuai yang dipakai project
docker compose --profile mysql up -d
# atau: docker compose --profile mysql --profile mongo up -d
# atau: docker compose --profile mysql --profile postgres --profile mongo up -d

# 5. Jalankan app
npm run dev
```

### Stop database
```bash
docker compose down --prorile nama_profile
```

---

## Staging & Production (VM/server)

### Setup pertama kali di server
```bash
# 1. Clone repo
git clone https://github.com/marcellocello/Boiler-Plate-Backend-Service.git
cd backend-service

# 2. Install Node.js sesuai versi (pakai nvm)
nvm use

# 3. Install dependencies
npm install --omit=dev

# 4. Buat env file
cp .env.example .env.staging    # untuk staging
cp .env.example .env.production # untuk production

# 5. Start dengan PM2
pm2 start ecosystem.config.cjs --env staging    # staging
pm2 start ecosystem.config.cjs --env production # production

# 6. Save PM2 process list agar auto-start saat server reboot
pm2 save
pm2 startup
```

### Deploy ulang (setelah git pull)
```bash
git pull origin main
npm install --omit=dev
pm2 reload ecosystem.config.cjs --env production
```

## Koneksi database di server

Database di staging/production diinstall langsung di VM (bukan Docker).

Contoh `.env.production`:
```env
NODE_ENV=production
DB_MYSQL=true
MYSQL_HOST=10.0.0.5   # IP database server
MYSQL_PORT=3306
MYSQL_USER=app_user
MYSQL_PASSWORD=<password>
MYSQL_DATABASE=app_db
```