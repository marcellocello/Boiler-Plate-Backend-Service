import * as userRepository from '../repositories/user.repository.js';
import { NotFoundError, ConflictError, ValidationError } from '../errors/AppError.js';

export async function getAllUsers({ page = 1, limit = 10 } = {}) {
  const parsedPage  = Math.max(1, Number(page));
  const parsedLimit = Math.min(100, Math.max(1, Number(limit)));
  const offset      = (parsedPage - 1) * parsedLimit;

  const [data, total] = await Promise.all([
    userRepository.findAll({ limit: parsedLimit, offset }),
    userRepository.countAll(),
  ]);

  return { data, total, page: parsedPage, limit: parsedLimit };
}

export async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(`User dengan id ${id} tidak ditemukan`);
  return user;
}

export async function getUserByEmail(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new NotFoundError(`User dengan email ${email} tidak ditemukan`);
  return user;
}

export async function getUserByPhone(phone) {
  const user = await userRepository.findByPhone(phone);
  if (!user) throw new NotFoundError(`User dengan phone ${phone} tidak ditemukan`);
  return user;
}

export async function createUser(data) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new ConflictError(`Email ${data.email} sudah terdaftar`);
  return userRepository.create(data);
}

export async function updateUser(id, data) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(`User dengan id ${id} tidak ditemukan`);

  if (data.email && data.email !== user.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new ConflictError(`Email ${data.email} sudah dipakai user lain`);
  }

  if (data.phone && data.phone !== user.phone) {
    const existing = await userRepository.findByPhone(data.phone);
    if (existing) throw new ConflictError(`Phone ${data.phone} sudah dipakai user lain`);
  }

  return userRepository.update(id, data);
}

export async function deleteUser(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(`User dengan id ${id} tidak ditemukan`);
  await userRepository.remove(id);
}