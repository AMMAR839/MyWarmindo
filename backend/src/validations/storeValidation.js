const { z } = require('zod');

const createStoreSchema = z.object({
  name: z.string().min(2, 'Nama warung minimal 2 karakter.'),
  slug: z.string().min(2, 'Slug warung minimal 2 karakter.'),
});

const createTableSchema = z.object({
  tableNumber: z.string().min(1, 'Nomor meja wajib diisi.'),
});

module.exports = { createStoreSchema, createTableSchema };
