const { z } = require('zod');

const orderItemSchema = z.object({
  menuItemId: z.string().uuid('ID menu item tidak valid.'),
  quantity: z.number().int().positive('Jumlah harus angka positif minimal 1.'),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  storeId: z.string().uuid('ID Warung tidak valid.'),
  tableNumber: z.string().min(1, 'Nomor meja wajib diisi.'),
  items: z.array(orderItemSchema).min(1, 'Pesanan minimal berisi 1 item menu.'),
});

const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'CANCELLED']),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
};
