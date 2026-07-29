import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiService {
  // Gunakan 127.0.0.1 langsung jika di Web untuk menghindari delay DNS IPv6 Chrome
  static String get baseUrl {
    if (kIsWeb) return 'http://127.0.0.1:5000/api';
    return 'http://10.0.2.2:5000/api';
  }
  
  // Fallback url dihapus karena kita sudah mendeteksi platform
  static String? token;

  static Map<String, String> get headers {
    final map = {'Content-Type': 'application/json'};
    if (token != null) {
      map['Authorization'] = 'Bearer $token';
    }
    return map;
  }

  // Auth Login Kasir / Owner
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        token = data['data']['token'];
      }
      return data;
    } catch (_) {
      return {'success': false, 'message': 'Gagal terhubung ke server.'};
    }
  }

  // Ambil Toko Demo
  static Future<Map<String, dynamic>> getStoreInfo(String slug) async {
    final response = await http.get(
      Uri.parse('$baseUrl/stores/$slug'),
      headers: headers,
    );
    return jsonDecode(response.body);
  }

  // Ambil Daftar Pesanan LUNAS Warung
  static Future<List<dynamic>> getOrdersByStore(String storeId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders/store/$storeId'),
      headers: headers,
    );
    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      return data['data'] ?? [];
    }
    return [];
  }

  // Update Status Pesanan ke COMPLETED (Selesai Diantar)
  static Future<bool> markOrderCompleted(String orderId) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/orders/$orderId/status'),
      headers: headers,
      body: jsonEncode({'orderStatus': 'COMPLETED'}),
    );
    final data = jsonDecode(response.body);
    return data['success'] == true;
  }

  // ─── Laporan & Analytics ────────────────────────────────────
  static Future<Map<String, dynamic>?> getStoreAnalytics(String storeId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders/analytics/$storeId'),
        headers: headers,
      );
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ─── Manajemen Menu ──────────────────────────────────────────
  
  static Future<List<dynamic>> getMenus(String storeId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/menus/store/$storeId?all=true'),
      headers: headers,
    );
    final data = jsonDecode(response.body);
    return data['success'] == true ? data['data'] : [];
  }

  static Future<bool> toggleMenuAvailability(String menuId, bool isAvailable) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/menus/$menuId/availability'),
      headers: headers,
      body: jsonEncode({'isAvailable': isAvailable}),
    );
    final data = jsonDecode(response.body);
    return data['success'] == true;
  }

  static Future<bool> createMenu(String storeId, Map<String, dynamic> menuData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/menus/store/$storeId'),
      headers: headers,
      body: jsonEncode(menuData),
    );
    final data = jsonDecode(response.body);
    return data['success'] == true;
  }

  static Future<bool> updateMenu(String menuId, Map<String, dynamic> menuData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/menus/$menuId'),
      headers: headers,
      body: jsonEncode(menuData),
    );
    final data = jsonDecode(response.body);
    return data['success'] == true;
  }

  static Future<bool> deleteMenu(String menuId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/menus/$menuId'),
      headers: headers,
    );
    final data = jsonDecode(response.body);
    return data['success'] == true;
  }
}

