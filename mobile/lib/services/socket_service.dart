import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static IO.Socket? _socket;

  static const String socketUrl = 'http://10.0.2.2:5000';
  static const String fallbackUrl = 'http://localhost:5000';

  static void initSocket(String storeId, Function(dynamic) onNewPaidOrder) {
    if (_socket != null && _socket!.connected) return;

    try {
      _socket = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .build(),
      );
    } catch (_) {
      _socket = IO.io(
        fallbackUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .build(),
      );
    }

    _socket!.onConnect((_) {
      print('⚡ [Flutter Socket] Terhubung ke Server!');
      _socket!.emit('join:kitchen', {'storeId': storeId});
    });

    _socket!.on('order:new_paid', (data) {
      print('🔔 [Flutter Socket] Pesanan LUNAS Baru Received!');
      onNewPaidOrder(data);
    });

    _socket!.onDisconnect((_) => print('🔌 [Flutter Socket] Terputus.'));
  }

  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
