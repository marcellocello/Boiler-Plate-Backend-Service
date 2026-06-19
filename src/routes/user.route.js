import * as userService from '../services/user.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../helpers/response.js';
import { ValidationError } from '../errors/AppError.js';

/**
 * User Routes
 *
 * GET    /api/users                      → semua user (pagination)
 * GET    /api/users/:id                  → user by id
 * GET    /api/users/search?email=        → user by email
 * GET    /api/users/search?phone=        → user by phone
 * POST   /api/users                      → tambah user
 * PUT    /api/users/:id                  → update user
 * DELETE /api/users/:id                  → hapus user
 */

const createUserSchema = {
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name:  { type: 'string', minLength: 2, maxLength: 100 },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string', maxLength: 20 },
    },
    additionalProperties: false,
  },
};

const updateUserSchema = {
  body: {
    type: 'object',
    minProperties: 1,
    properties: {
      name:  { type: 'string', minLength: 2, maxLength: 100 },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string', maxLength: 20 },
    },
    additionalProperties: false,
  },
};

const getUsersQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      page:  { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    },
  },
};

const searchQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      phone: { type: 'string' },
    },
  },
};

export default async function userRoutes(fastify) {
  fastify.get('/', { schema: getUsersQuerySchema }, async (request, reply) => {
    const { page, limit } = request.query;
    const result = await userService.getAllUsers({ page, limit });

    return sendPaginated(reply, {
      data:    result.data,
      total:   result.total,
      page:    result.page,
      limit:   result.limit,
      message: 'Berhasil mengambil data user',
    });
  });

  fastify.get('/search', { schema: searchQuerySchema }, async (request, reply) => {
    const { email, phone } = request.query;

    if (!email && !phone) {
      throw new ValidationError('Parameter email atau phone wajib diisi', [
        { field: 'email', message: 'isi salah satu: email atau phone' },
        { field: 'phone', message: 'isi salah satu: email atau phone' },
      ]);
    }

    const user = email
      ? await userService.getUserByEmail(email)
      : await userService.getUserByPhone(phone);

    return sendSuccess(reply, {
      data:    user,
      message: 'Berhasil mengambil data user',
    });
  });

  fastify.get('/:id', async (request, reply) => {
    const user = await userService.getUserById(Number(request.params.id));
    return sendSuccess(reply, {
      data:    user,
      message: 'Berhasil mengambil data user',
    });
  });

  fastify.post('/', { schema: createUserSchema }, async (request, reply) => {
    const user = await userService.createUser(request.body);
    return sendCreated(reply, {
      data:    user,
      message: 'User berhasil dibuat',
    });
  });

  fastify.put('/:id', { schema: updateUserSchema }, async (request, reply) => {
    const user = await userService.updateUser(Number(request.params.id), request.body);
    return sendSuccess(reply, {
      data:    user,
      message: 'User berhasil diupdate',
    });
  });

  fastify.delete('/:id', async (request, reply) => {
    await userService.deleteUser(Number(request.params.id));
    return sendSuccess(reply, {
      data:    null,
      message: 'User berhasil dihapus',
    });
  });
}