import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MenuManagementScreen extends StatefulWidget {
  final String storeId;

  const MenuManagementScreen({super.key, required this.storeId});

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  List<dynamic> _menus = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMenus();
  }

  Future<void> _loadMenus() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getMenus(widget.storeId);
    setState(() {
      _menus = data;
      _isLoading = false;
    });
  }

  Future<void> _toggleAvailability(String menuId, bool currentStatus) async {
    final success = await ApiService.toggleMenuAvailability(menuId, !currentStatus);
    if (success) {
      setState(() {
        final index = _menus.indexWhere((m) => m['id'] == menuId);
        if (index != -1) {
          _menus[index]['isAvailable'] = !currentStatus;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status menu diperbarui.'), backgroundColor: Color(0xFF2D7A4F)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal memperbarui status.'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _showMenuDialog({Map<String, dynamic>? menu}) async {
    final isEditing = menu != null;
    final nameController = TextEditingController(text: menu?['name'] ?? '');
    final priceController = TextEditingController(text: menu?['price']?.toString() ?? '');
    String category = menu?['category'] ?? 'MAKANAN';

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFFFAF8F4),
              title: Text(isEditing ? 'Edit Menu' : 'Tambah Menu Baru'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(labelText: 'Nama Menu'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: priceController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Harga (Rp)'),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: category,
                      decoration: const InputDecoration(labelText: 'Kategori'),
                      items: const [
                        DropdownMenuItem(value: 'MAKANAN', child: Text('Makanan')),
                        DropdownMenuItem(value: 'MINUMAN', child: Text('Minuman')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => category = val);
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal', style: TextStyle(color: Color(0xFF9A8570))),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final data = {
                      'name': nameController.text.trim(),
                      'price': double.tryParse(priceController.text.trim()) ?? 0,
                      'category': category,
                      'isAvailable': menu?['isAvailable'] ?? true,
                    };

                    bool success;
                    if (isEditing) {
                      success = await ApiService.updateMenu(menu['id'], data);
                    } else {
                      success = await ApiService.createMenu(widget.storeId, data);
                    }

                    if (success) {
                      Navigator.pop(context);
                      _loadMenus();
                    }
                  },
                  child: const Text('Simpan'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _deleteMenu(String menuId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFFFAF8F4),
        title: const Text('Hapus Menu?'),
        content: const Text('Menu ini akan dihapus permanen dari sistem.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal', style: TextStyle(color: Color(0xFF9A8570))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await ApiService.deleteMenu(menuId);
      if (success) {
        _loadMenus();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kelola Menu'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showMenuDialog(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadMenus,
              color: const Color(0xFFC4622A),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _menus.length,
                itemBuilder: (context, index) {
                  final menu = _menus[index];
                  final isAvailable = menu['isAvailable'] == true;

                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFFE8E0D4)),
                    ),
                    color: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      menu['category'] == 'MAKANAN' ? '🍜 ' : '🥤 ',
                                      style: const TextStyle(fontSize: 16),
                                    ),
                                    Expanded(
                                      child: Text(
                                        menu['name'],
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: isAvailable ? const Color(0xFF2D1A0A) : const Color(0xFF9A8570),
                                          decoration: isAvailable ? TextDecoration.none : TextDecoration.lineThrough,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Rp ${menu['price']}',
                                  style: const TextStyle(
                                    color: Color(0xFFC4622A),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: isAvailable,
                            activeThumbColor: const Color(0xFFC4622A),
                            onChanged: (val) => _toggleAvailability(menu['id'], !val),
                          ),
                          PopupMenuButton<String>(
                            icon: const Icon(Icons.more_vert, color: Color(0xFF9A8570)),
                            onSelected: (val) {
                              if (val == 'edit') _showMenuDialog(menu: menu);
                              if (val == 'delete') _deleteMenu(menu['id']);
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'edit',
                                child: Text('Edit Menu'),
                              ),
                              const PopupMenuItem(
                                value: 'delete',
                                child: Text('Hapus Menu', style: TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
