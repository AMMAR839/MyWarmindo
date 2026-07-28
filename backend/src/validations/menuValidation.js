const { z } = require('zod');

const createMenuSchema = z.object({
  name: z.string().min(2, 'Nama menu minimal 2 karakter.'),
  price: z.number().positive('Harga harus berupa angka positif.'),
  isAvailable: z.boolean().optional().default(true),
});

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

module.exports = { createMenuSchema, updateAvailabilitySchema };
