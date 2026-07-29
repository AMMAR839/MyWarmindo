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
      appBar: AppBar(
        title: const Text('Laporan Bisnis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnalytics,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAnalytics,
              color: const Color(0xFFC4622A),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ─── Stat Cards Grid ────────────────────────────────
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            title: 'Omzet Hari Ini',
                            value: 'Rp $todayRevenue',
                            subtitle: '$todayOrders pesanan lunas',
                            icon: Icons.payments,
                            bgColor: const Color(0xFFFDF6EC),
                            borderColor: const Color(0xFFE8C98A),
                            iconColor: const Color(0xFF8B5E1A),
                            valueColor: const Color(0xFFC4622A),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildStatCard(
                            title: 'Total Pendapatan',
                            value: 'Rp $totalRevenue',
                            subtitle: '$totalOrders total pesanan',
                            icon: Icons.account_balance_wallet,
                            bgColor: const Color(0xFFEDF7F0),
                            borderColor: const Color(0xFFA8D9B8),
                            iconColor: const Color(0xFF2D7A4F),
                            valueColor: const Color(0xFF2D7A4F),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // ─── Top Selling Section ─────────────────────────────
                    const Row(
                      children: [
                        Icon(Icons.emoji_events, color: Color(0xFFC4622A), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Menu Paling Laris',
                          style: TextStyle(
                            color: Color(0xFF2D1A0A),
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (topSelling.isEmpty)
                      const Text(
                        'Belum ada data menu terlaris hari ini.',
                        style: TextStyle(color: Color(0xFF9A8570), fontSize: 14),
                      )
                    else
                      ...topSelling.asMap().entries.map((entry) {
                        final index = entry.key;
                        final item = entry.value;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE8E0D4)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: index == 0 ? const Color(0xFFFDF6EC) : const Color(0xFFF0EBE3),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '${index + 1}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: index == 0 ? const Color(0xFF8B5E1A) : const Color(0xFF9A8570),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['name'] ?? '',
                                      style: const TextStyle(
                                        color: Color(0xFF2D1A0A),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Terjual ${item['quantity']} porsi',
                                      style: const TextStyle(color: Color(0xFF9A8570), fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                'Rp ${item['revenue']}',
                                style: const TextStyle(
                                  color: Color(0xFFC4622A),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),

                    const SizedBox(height: 32),

                    // ─── Recent Transactions ────────────────────────────
                    const Row(
                      children: [
                        Icon(Icons.history, color: Color(0xFF9A8570), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Riwayat Transaksi Terakhir',
                          style: TextStyle(
                            color: Color(0xFF2D1A0A),
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (recentOrders.isEmpty)
                      const Text(
                        'Belum ada transaksi lunas.',
                        style: TextStyle(color: Color(0xFF9A8570), fontSize: 14),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: recentOrders.length,
                        itemBuilder: (context, index) {
                          final order = recentOrders[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE8E0D4)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFEDF7F0),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.check, size: 16, color: Color(0xFF2D7A4F)),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        order['tableNumber'] ?? 'Meja',
                                        style: const TextStyle(
                                          color: Color(0xFF2D1A0A),
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        order['orderStatus'] == 'COMPLETED' ? 'Selesai' : 'Sedang Dimasak',
                                        style: const TextStyle(color: Color(0xFF9A8570), fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  'Rp ${order['totalAmount']}',
                                  style: const TextStyle(
                                    color: Color(0xFF2D1A0A),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 40),
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
    required Color bgColor,
    required Color borderColor,
    required Color iconColor,
    required Color valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: iconColor.withValues(alpha: 0.8),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(icon, color: iconColor, size: 20),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: valueColor,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              color: iconColor.withValues(alpha: 0.7),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
