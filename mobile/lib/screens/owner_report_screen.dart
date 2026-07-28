import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OwnerReportScreen extends StatefulWidget {
  final String storeId;

  const OwnerReportScreen({super.key, required this.storeId});

  @override
  State<OwnerReportScreen> createState() => _OwnerReportScreenState();
}

class _OwnerReportScreenState extends State<OwnerReportScreen> {
  Map<String, dynamic>? _analyticsData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getStoreAnalytics(widget.storeId);
    setState(() {
      _analyticsData = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final todayRevenue = _analyticsData?['todayRevenue'] ?? 0;
    final totalRevenue = _analyticsData?['totalRevenue'] ?? 0;
    final todayOrders = _analyticsData?['todayOrders'] ?? 0;
    final totalOrders = _analyticsData?['totalOrders'] ?? 0;
    final topSelling = (_analyticsData?['topSelling'] as List?) ?? [];
    final recentOrders = (_analyticsData?['recentOrders'] as List?) ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('📊 Dashboard Pemilik Warmindo'),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnalytics,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : RefreshIndicator(
              onRefresh: _loadAnalytics,
              color: Colors.orange,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ─── Stat Cards Grid ────────────────────────────────
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            title: 'Omzet Hari Ini',
                            value: 'Rp ${todayRevenue.toString()}',
                            subtitle: '$todayOrders pesanan lunas',
                            icon: Icons.payments,
                            color: Colors.orangeAccent,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            title: 'Total Pendapatan',
                            value: 'Rp ${totalRevenue.toString()}',
                            subtitle: '$totalOrders total pesanan',
                            icon: Icons.account_balance_wallet,
                            color: Colors.emeraldAccent,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ─── Top Selling Section ─────────────────────────────
                    const Text(
                      '🏆 Menu Terlaris Warmindo',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    if (topSelling.isEmpty)
                      const Text(
                        'Belum ada data menu terlaris.',
                        style: TextStyle(color: Colors.slate400, fontSize: 13),
                      )
                    else
                      ...topSelling.map((item) => Card(
                            color: const Color(0xFF1E293B),
                            margin: const EdgeInsets.only(bottom: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(color: Colors.orange.withOpacity(0.3)),
                            ),
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Colors.orange,
                                child: Text('🍜', style: TextStyle(fontSize: 18)),
                              ),
                              title: Text(
                                item['name'] ?? '',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: Text(
                                'Terjual ${item['quantity']} porsi',
                                style: const TextStyle(color: Colors.slate400, fontSize: 12),
                              ),
                              trailing: Text(
                                'Rp ${item['revenue']}',
                                style: const TextStyle(
                                  color: Colors.orangeAccent,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          )),

                    const SizedBox(height: 20),

                    // ─── Recent Transactions ────────────────────────────
                    const Text(
                      '🧾 Transaksi Terbaru',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    if (recentOrders.isEmpty)
                      const Text(
                        'Belum ada transaksi lunas.',
                        style: TextStyle(color: Colors.slate400, fontSize: 13),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: recentOrders.length,
                        itemBuilder: (context, index) {
                          final order = recentOrders[index];
                          return Card(
                            color: const Color(0xFF1E293B),
                            margin: const EdgeInsets.only(bottom: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              title: Text(
                                '${order['tableNumber']} — Rp ${order['totalAmount']}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: Text(
                                'Status: ${order['orderStatus']}',
                                style: const TextStyle(color: Colors.slate400, fontSize: 12),
                              ),
                              trailing: const Icon(Icons.check_circle, color: Colors.green),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: color.withOpacity(0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.slate400, fontSize: 12),
                ),
                Icon(icon, color: color, size: 20),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.extrabold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(color: Colors.slate400, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}
