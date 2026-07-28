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
              '🔔 PESANAN LUNAS BARU! (${data['order']['tableNumber']})',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            backgroundColor: Colors.emerald,
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
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('👨‍🍳 Antrean Dapur & Kasir Live'),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : _orders.isEmpty
              ? const Center(
                  child: Text(
                    'Belum Ada Pesanan Lunas 😴',
                    style: TextStyle(color: Colors.slate400, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _orders.length,
                  itemBuilder: (context, index) {
                    final order = _orders[index];
                    final isCompleted = order['orderStatus'] == 'COMPLETED';

                    return Card(
                      color: isCompleted
                          ? const Color(0xFF1E293B).withOpacity(0.5)
                          : const Color(0xFF1E293B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isCompleted ? Colors.transparent : Colors.orangeAccent.withOpacity(0.5),
                        ),
                      ),
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Chip(
                                  label: Text(
                                    order['tableNumber'] ?? 'Meja',
                                    style: const TextStyle(
                                      color: Colors.orange,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  backgroundColor: Colors.orange.withOpacity(0.2),
                                ),
                                const Chip(
                                  label: Text(
                                    '💳 LUNAS',
                                    style: TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                  backgroundColor: Colors.greenAccent,
                                ),
                              ],
                            ),
                            const Divider(color: Colors.slate700),
                            ...?order['orderItems']?.map<Widget>((item) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            item['menuName'] ?? '',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          Text(
                                            'x${item['quantity']}',
                                            style: const TextStyle(
                                              color: Colors.orange,
                                              fontWeight: FontWeight.extrabold,
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (item['notes'] != null && item['notes'].toString().isNotEmpty)
                                        Text(
                                          '📝 ${item['notes']}',
                                          style: const TextStyle(
                                            color: Colors.amberAccent,
                                            fontSize: 12,
                                            fontStyle: FontStyle.italic,
                                          ),
                                        ),
                                    ],
                                  ),
                                )),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total: Rp ${order['totalAmount']}',
                                  style: const TextStyle(
                                    color: Colors.orangeAccent,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                if (!isCompleted)
                                  ElevatedButton.icon(
                                    onPressed: () => _handleComplete(order['id']),
                                    icon: const Icon(Icons.check_circle, size: 18),
                                    label: const Text('Selesai Diantar'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.orange[700],
                                    ),
                                  )
                                else
                                  const Text(
                                    '✔️ Selesai',
                                    style: TextStyle(color: Colors.slate500),
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
