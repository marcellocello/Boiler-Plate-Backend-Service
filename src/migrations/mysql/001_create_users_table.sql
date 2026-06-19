-- Migration: 001_create_users_table.sql
-- Tabel users dengan kolom terenkripsi (email, phone)

CREATE TABLE IF NOT EXISTS users (
    id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,

    -- Kolom terenkripsi - disimpan sebagai ciphertext AES-256-GCM
    -- Format: "iv:authTag:ciphertext" (base64)
    email           TEXT NOT NULL,
    email_index     VARCHAR(64) NOT NULL UNIQUE, -- HMAC-SHA256 dari email (untuk search)

    phone           TEXT NOT NULL,
    phone_index     VARCHAR(64) UNIQUE, -- HMAC-SHA256 dari phone (untuk search)

    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email_index ON users (email_index);
CREATE INDEX idx_users_phone_index ON users (phone_index);
CREATE INDEX idx_users_created_at ON users (created_at DESC);