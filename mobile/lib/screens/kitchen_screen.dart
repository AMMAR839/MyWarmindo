import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class KitchenScreen extends StatefulWidget {
  final String storeId;

  const KitchenScreen({super.key, required this.storeId});

  @override
  State<KitchenScreen> createState() => _KitchenScreenState();
}

class _KitchenScreenState extends State<KitchenScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
    _connectSocket();
  }

  Future<void> _loadOrders() async {
    final list = await ApiService.getOrdersByStore(widget.storeId);
    setState(() {
      _orders = list;
      _isLoading = false;
    });
  }

  void _connectSocket() {
    SocketService.initSocket(widget.storeId, (data) {
      if (data['order'] != null) {
        setState(() {
          _orders.insert(0, data['order']);
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Pesanan baru masuk dari ${data['order']['tableNumber']}!',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFF2D7A4F), // Green
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    });
  }

  Future<void> _handleComplete(String orderId) async {
    final success = await ApiService.markOrderCompleted(orderId);
    if (success) {
      setState(() {
        for (var o in _orders) {
          if (o['id'] == orderId) {
            o['orderStatus'] = 'COMPLETED';
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Antrean Dapur'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long, size: 64, color: Color(0xFFE8E0D4)),
                      SizedBox(height: 16),
                      Text(
                        'Belum ada pesanan aktif',
                        style: TextStyle(color: Color(0xFF9A8570), fontSize: 16),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _orders.length,
                  itemBuilder: (context, index) {
                    final order = _orders[index];
                    final isCompleted = order['orderStatus'] == 'COMPLETED';

                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isCompleted ? const Color(0xFFE8E0D4) : const Color(0xFFC4622A).withValues(alpha: 0.3),
                          width: isCompleted ? 1 : 2,
                        ),
                      ),
                      color: isCompleted ? const Color(0xFFF0EBE3) : Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFDF6EC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFE8C98A)),
                                  ),
                                  child: Text(
                                    order['tableNumber'] ?? 'Meja',
                                    style: const TextStyle(
                                      color: Color(0xFF8B5E1A),
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEDF7F0),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFA8D9B8)),
                                  ),
                                  child: const Text(
                                    'LUNAS',
                                    style: TextStyle(
                                      color: Color(0xFF2D7A4F),
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Divider(color: Color(0xFFE8E0D4), height: 1),
                            const SizedBox(height: 16),
                            ...?order['orderItems']?.map<Widget>((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item['menuName'] ?? '',
                                              style: TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 15,
                                                color: isCompleted ? const Color(0xFF9A8570) : const Color(0xFF2D1A0A),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            '×${item['quantity']}',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              color: isCompleted ? const Color(0xFF9A8570) : const Color(0xFFC4622A),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (item['notes'] != null && item['notes'].toString().isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text(
                                            'Catatan: ${item['notes']}',
                                            style: const TextStyle(
                                              color: Color(0xFF8B3E1C),
                                              fontSize: 13,
                                              fontStyle: FontStyle.italic,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                )),
                            const SizedBox(height: 8),
                            const Divider(color: Color(0xFFE8E0D4), height: 1),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Total Pembayaran', style: TextStyle(fontSize: 12, color: Color(0xFF9A8570))),
                                    Text(
                                      'Rp ${order['totalAmount']}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: isCompleted ? const Color(0xFF9A8570) : const Color(0xFF2D1A0A),
                                      ),
                                    ),
                                  ],
                                ),
                                if (!isCompleted)
                                  ElevatedButton(
                                    onPressed: () => _handleComplete(order['id']),
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    ),
                                    child: const Text('Selesai Diantar'),
                                  )
                                else
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE8E0D4),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.check, size: 16, color: Color(0xFF9A8570)),
                                        SizedBox(width: 6),
                                        Text('Selesai', style: TextStyle(color: Color(0xFF9A8570), fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
