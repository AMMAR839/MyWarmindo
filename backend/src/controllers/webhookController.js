const crypto = require('crypto');
const { prisma } = require('../config/db');
const { emitToRoom } = require('../config/socket');

/**
 * Handle Midtrans Payment Notification Webhook
 * Signature Key Formula: sha512(order_id + status_code + gross_amount + ServerKey)
 */
const handleMidtransWebhook = async (req, res, next) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = req.body;

    console.log(`🔔 [Webhook Midtrans] Received notification for Order #${order_id}`);

    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DUMMY-KEY-12345';

    // 1. Verifikasi Signature Key (Keamanan Enkripsi SHA-512)
    const payloadToHash = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(payloadToHash)
      .digest('hex');

    if (signature_key && signature_key !== expectedSignature) {
      console.error('❌ Signature Key Mismatch! Transaksi mencurigakan atau dipalsukan.');
      return res.status(403).json({
        success: false,
        message: 'Invalid signature key. Akses ditolak.',
      });
    }

    // 2. Cari Pesanan di Database
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        store: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan.',
      });
    }

    // IDEMPOTENCY GUARD: Jika pembayaran sudah PAID, jangan proses ulang
    if (order.paymentStatus === 'PAID') {
      console.log(`ℹ️ [Webhook] Order #${order_id} sudah PAID. Idempotency skip.`);
      return res.status(200).json({
        success: true,
        message: 'Notification already processed (idempotent).',
        data: { orderId: order.id, paymentStatus: order.paymentStatus },
      });
    }

    // 3. Tentukan Status Pembayaran
    let newPaymentStatus = order.paymentStatus;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        newPaymentStatus = 'PAID';
      }
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      newPaymentStatus = 'FAILED';
    }

    // 4. Update Status di DB jika ada perubahan
    let updatedOrder = order;
    if (newPaymentStatus !== order.paymentStatus) {
      updatedOrder = await prisma.order.update({
        where: { id: order_id },
        data: { paymentStatus: newPaymentStatus },
        include: {
          orderItems: true,
        },
      });

      console.log(`✅ Status Pembayaran Order #${order_id} diperbarui ke: ${newPaymentStatus}`);

      // 5. Broadcast Socket.io ke Dapur & Pelanggan jika LUNAS
      if (newPaymentStatus === 'PAID') {
        const formattedItems = updatedOrder.orderItems.map((item) => ({
          id: item.id,
          menuName: item.menuName,
          price: Number(item.price),
          quantity: item.quantity,
          notes: item.notes,
        }));

        const socketData = {
          order: {
            id: updatedOrder.id,
            tableNumber: updatedOrder.tableNumber,
            totalAmount: Number(updatedOrder.totalAmount),
            paymentStatus: updatedOrder.paymentStatus,
            orderStatus: updatedOrder.orderStatus,
            createdAt: updatedOrder.createdAt,
            orderItems: formattedItems,
          },
        };

        // Broadcast ke Dapur & Pelanggan
        emitToRoom(`store_${updatedOrder.storeId}_kitchen`, 'order:new_paid', socketData);
        emitToRoom(`order_${updatedOrder.id}`, 'order:status_updated', {
          orderId: updatedOrder.id,
          paymentStatus: 'PAID',
          orderStatus: updatedOrder.orderStatus,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notification processed successfully.',
      data: {
        orderId: updatedOrder.id,
        paymentStatus: updatedOrder.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleMidtransWebhook,
};
