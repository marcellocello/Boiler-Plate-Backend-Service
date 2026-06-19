-- Migration: 001_crete_users_table.sql
-- Table users dengan kolom terenkripsi (email, phone)
-- dan blind index untuk exact search

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,

    -- Kolom terenkripsi - disimpan sebagai ciphertext AES-256-GCM
    -- Format: "iv:authTag:ciphertext" (base64)
    email       TEXT NOT NULL,
    email_index VARCHAR(64) NOT NULL UNIQUE, -- HMAC-SHA256 dari email (untuk search)

    phone       TEXT,
    phone_index VARCHAR(64) UNIQUE, -- HMAC-SHA256 dari phone (untuk search)

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_users_email_index ON users (email_index);
CREATE INDEX IF NOT EXISTS idx_users_phone_index ON users (phone_index);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);