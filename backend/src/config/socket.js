const { Server } = require('socket.io');

let io;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client WebSocket terhubung: ${socket.id}`);

    // Client HP Kasir/Dapur bergabung ke room warung
    socket.on('join:kitchen', ({ storeId }) => {
      if (storeId && typeof storeId === 'string' && storeId.length <= 64) {
        const roomName = `store_${storeId}_kitchen`;
        socket.join(roomName);
        console.log(`👨‍🍳 Socket ${socket.id} bergabung ke room Dapur: ${roomName}`);
        socket.emit('joined', { room: roomName, message: 'Berhasil terhubung ke Room Dapur.' });
      }
    });

    // Client HP Pelanggan bergabung ke room pesanan meja
    socket.on('join:order', ({ orderId }) => {
      if (orderId && typeof orderId === 'string' && orderId.length <= 64) {
        const roomName = `order_${orderId}`;
        socket.join(roomName);
        console.log(`📱 Socket ${socket.id} bergabung ke room Pesanan Pelanggan: ${roomName}`);
        socket.emit('joined', { room: roomName, message: 'Berhasil terhubung ke Room Pesanan.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client WebSocket terputus: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io belum diinisialisasi!');
  }
  return io;
};

const emitToRoom = (roomName, eventName, payload) => {
  if (io) {
    io.to(roomName).emit(eventName, payload);
    console.log(`📢 [Socket Broadcast] Event '${eventName}' dikirim ke room '${roomName}'`);
  }
};

module.exports = { initSocket, getIO, emitToRoom };
