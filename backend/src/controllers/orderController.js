const { prisma } = require('../config/db');
const { emitToRoom } = require('../config/socket');
const {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} = require('../validations/orderValidation');

const createOrder = async (req, res, next) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);

    // Ambil semua menuItemId yang dipesan
    const menuItemIds = validatedData.items.map((i) => i.menuItemId);

    // Ambil data menu asli dari DB untuk verifikasi harga dan ketersediaan
    const dbMenus = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        storeId: validatedData.storeId,
      },
    });

    if (dbMenus.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Satu atau lebih menu yang dipesan tidak ditemukan di katalog.',
      });
    }

    // Peta menu berdasar ID
    const menuMap = new Map(dbMenus.map((m) => [m.id, m]));

    // Cek ketersediaan & Hitung Total Amount secara server-side
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of validatedData.items) {
      const menu = menuMap.get(item.menuItemId);
      if (!menu.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu '${menu.name}' sedang tidak tersedia / habis.`,
        });
      }

      const itemPrice = Number(menu.price);
      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        menuItemId: menu.id,
        menuName: menu.name,
        price: itemPrice,
        quantity: item.quantity,
        notes: item.notes || null,
      });
    }

    // Buat Order & OrderItems di DB
    const order = await prisma.order.create({
      data: {
        storeId: validatedData.storeId,
        tableNumber: validatedData.tableNumber,
        totalAmount: totalAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran via QRIS.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersByStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { status, payment } = req.query;

    const whereCondition = { storeId };
    if (status) whereCondition.orderStatus = status;

    // Aturan Pay-First: Dapur/Kasir secara default HANYA melihat pesanan LUNAS (PAID)
    if (payment === 'ALL') {
      // Tampilkan semua transaksi termasuk yang belum bayar
    } else if (payment) {
      whereCondition.paymentStatus = payment;
    } else {
      whereCondition.paymentStatus = 'PAID'; // Default Pay-First
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        orderItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        store: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: { orderStatus: validatedData.orderStatus },
      include: { orderItems: true },
    });

    // Broadcast Socket.io ke HP Pelanggan
    emitToRoom(`order_${order.id}`, 'order:status_updated', {
      orderId: order.id,
      orderStatus: order.orderStatus,
      message: order.orderStatus === 'COMPLETED' ? 'Makanan Selesai Diantar ke Meja!' : 'Status pesanan diperbarui.',
    });

    res.status(200).json({
      success: true,
      message: `Status pesanan berhasil diperbarui menjadi ${order.orderStatus}.`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updatePaymentStatusSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus: validatedData.paymentStatus },
      include: { orderItems: true },
    });

    // Jika Pembayaran Sukses (PAID), Bunyikan Socket.io di HP Kasir/Dapur
    if (order.paymentStatus === 'PAID') {
      const kitchenRoom = `store_${order.storeId}_kitchen`;
      emitToRoom(kitchenRoom, 'order:new_paid', {
        title: '🔔 PESANAN BARU LUNAS!',
        order: order,
      });

      // Juga kabarkan HP Pelanggan bahwa QRIS sudah lunas
      emitToRoom(`order_${order.id}`, 'order:status_updated', {
        orderId: order.id,
        paymentStatus: 'PAID',
        message: 'Pembayaran QRIS Berhasil! Pesanan sedang disiapkan.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Status pembayaran berhasil diperbarui menjadi ${order.paymentStatus}.`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getStoreAnalytics = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    // Filter tanggal hari ini (00:00:00 s/d 23:59:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Ambil semua transaksi LUNAS warung ini
    const paidOrders = await prisma.order.findMany({
      where: {
        storeId,
        paymentStatus: 'PAID',
      },
      include: {
        orderItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let todayRevenue = 0;
    let todayOrdersCount = 0;

    const itemSalesMap = new Map(); // menuName -> { quantity, totalRevenue }

    for (const order of paidOrders) {
      const amount = Number(order.totalAmount);
      totalRevenue += amount;

      if (new Date(order.createdAt) >= startOfDay) {
        todayRevenue += amount;
        todayOrdersCount += 1;
      }

      for (const item of order.orderItems) {
        const existing = itemSalesMap.get(item.menuName) || { quantity: 0, revenue: 0 };
        itemSalesMap.set(item.menuName, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + Number(item.price) * item.quantity,
        });
      }
    }

    // Urutkan menu terlaris
    const topSelling = Array.from(itemSalesMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        totalOrders: paidOrders.length,
        todayOrders: todayOrdersCount,
        topSelling,
        recentOrders: paidOrders.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrdersByStore,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getStoreAnalytics,
};

