const { z } = require('zod');

const createMenuSchema = z.object({
  name: z.string().min(2, 'Nama menu minimal 2 karakter.'),
  price: z.number().positive('Harga harus berupa angka positif.'),
  category: z.enum(['MAKANAN', 'MINUMAN'], { required_error: 'Kategori wajib diisi.' }),
  isAvailable: z.boolean().optional().default(true),
});

const updateMenuSchema = z.object({
  name: z.string().min(2, 'Nama menu minimal 2 karakter.'),
  price: z.number().positive('Harga harus berupa angka positif.'),
  category: z.enum(['MAKANAN', 'MINUMAN']),
  isAvailable: z.boolean().optional(),
});

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

module.exports = { createMenuSchema, updateMenuSchema, updateAvailabilitySchema };
