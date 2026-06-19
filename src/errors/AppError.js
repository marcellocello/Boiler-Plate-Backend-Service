/**
 * ============================================================
 * Custom Error Classes
 * ============================================================
 * Gunakan class ini untuk throw error dari route/service.
 * Semua error ini akan ditangkap global error handler di app.js
 * dan dikembalikan dalam format response yang konsisten.
 *
 * @example
 * throw new NotFoundError('User tidak ditemukan');
 * throw new ValidationError('Email tidak valid');
 * throw new UnauthorizedError();
 * throw new ForbiddenError('Akses ditolak');
 * throw new ConflictError('Email sudah terdaftar');
 * throw new AppError('Custom error', 422, 'CUSTOM_CODE');
 * ============================================================
 */

export class AppError extends Error {
    constructor(message = 'Terjadi kesalahan', statusCode = 500, code = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;       // kode error custom, contoh: 'USER_NOT_FOUND'
        this.isOperational = true;      // membedakan error yang kita throw vs error unexpected
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Data tidak ditemukan') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Data tidak valid', details = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.details = details;     // array field yang error, contoh: [{ field: 'email', message: 'tidak valid' }]
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Autentikasi diperlukan') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Akses ditolak') {
        super(message, 403, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Data sudah ada') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}