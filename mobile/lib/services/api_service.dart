import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // IP localhost untuk Android Emulator (10.0.2.2) atau Chrome/Desktop (localhost)
  static const String baseUrl = 'http://10.0.2.2:5000/api';
  static const String fallbackUrl = 'http://localhost:5000/api';

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
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        token = data['data']['token'];
      }
      return data;
    } catch (_) {
      // Fallback ke localhost jika emulator timeout
      final response = await http.post(
        Uri.parse('$fallbackUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        token = data['data']['token'];
      }
      return data;
    }
  }

  // Ambil Toko Demo
  static Future<Map<String, dynamic>> getStoreInfo(String slug) async {
    final response = await http.get(
      Uri.parse('$baseUrl/stores/$slug'),
      headers: headers,
    ).catchError((_) => http.get(Uri.parse('$fallbackUrl/stores/$slug'), headers: headers));

    return jsonDecode(response.body);
  }

  // Ambil Daftar Pesanan LUNAS Warung
  static Future<List<dynamic>> getOrdersByStore(String storeId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders/store/$storeId'),
      headers: headers,
    ).catchError((_) => http.get(Uri.parse('$fallbackUrl/orders/store/$storeId'), headers: headers));

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
    ).catchError((_) => http.patch(
      Uri.parse('$fallbackUrl/orders/$orderId/status'),
      headers: headers,
      body: jsonEncode({'orderStatus': 'COMPLETED'}),
    ));

    final data = jsonDecode(response.body);
    return data['success'] == true;
  }

  // Ambil Laporan Analytics Omzet untuk Pemilik Warung (Owner)
  static Future<Map<String, dynamic>?> getStoreAnalytics(String storeId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders/analytics/$storeId'),
        headers: headers,
      ).catchError((_) => http.get(Uri.parse('$fallbackUrl/orders/analytics/$storeId'), headers: headers));

      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['data'];
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}

