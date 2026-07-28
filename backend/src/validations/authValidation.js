const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  name: z.string().min(2, 'Nama minimal 2 karakter.'),
  role: z.enum(['OWNER', 'KASIR']).optional().default('KASIR'),
  storeId: z.string().uuid('ID Warung tidak valid.'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

module.exports = { registerSchema, loginSchema };
