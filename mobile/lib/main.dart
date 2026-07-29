import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/kitchen_screen.dart';
import 'screens/owner_report_screen.dart';
import 'screens/qr_generator_screen.dart';
import 'screens/menu_management_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const WarmindoApp());
}

class WarmindoApp extends StatelessWidget {
  const WarmindoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Warmindo POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFFAF8F4), // Cream
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFC4622A), // Terracotta
          primary: const Color(0xFFC4622A),
          secondary: const Color(0xFF8B3E1C), // Sienna
          background: const Color(0xFFFAF8F4),
          surface: const Color(0xFFF0EBE3), // Parchment
          onBackground: const Color(0xFF2D1A0A), // Espresso
          onSurface: const Color(0xFF2D1A0A),
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          Theme.of(context).textTheme,
        ).apply(
          bodyColor: const Color(0xFF2D1A0A),
          displayColor: const Color(0xFF2D1A0A),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: const Color(0xFFFAF8F4),
          elevation: 0,
          centerTitle: true,
          iconTheme: const IconThemeData(color: Color(0xFF2D1A0A)),
          titleTextStyle: GoogleFonts.plusJakartaSans(
            color: const Color(0xFF2D1A0A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFC4622A),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE8E0D4)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE8E0D4)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFC4622A), width: 2),
          ),
          labelStyle: const TextStyle(color: Color(0xFF9A8570)),
        ),
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoggedIn = false;
  String _storeId = 'warmindo-berkah-api-test'; // Default untuk demo

  void _onLoginSuccess(Map<String, dynamic> loginData) {
    final user = loginData['user'];
    setState(() {
      _isLoggedIn = true;
      _storeId = user['storeId'];
    });
  }

  void _onLogout() {
    setState(() {
      _isLoggedIn = false;
      ApiService.token = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoggedIn) {
      return LoginScreen(onLoginSuccess: _onLoginSuccess);
    }
    return MainDashboard(storeId: _storeId, onLogout: _onLogout);
  }
}

class MainDashboard extends StatefulWidget {
  final String storeId;
  final VoidCallback onLogout;

  const MainDashboard({
    super.key,
    required this.storeId,
    required this.onLogout,
  });

  @override
  State<MainDashboard> createState() => _MainDashboardState();
}

class _MainDashboardState extends State<MainDashboard> {
  int _currentIndex = 0;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      KitchenScreen(storeId: widget.storeId),
      OwnerReportScreen(storeId: widget.storeId),
      MenuManagementScreen(storeId: widget.storeId),
      QrGeneratorScreen(storeSlug: widget.storeId),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Warmindo Berkah'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFFC4622A)),
            onPressed: widget.onLogout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE8E0D4), width: 1)),
        ),
        child: NavigationBar(
          backgroundColor: const Color(0xFFFAF8F4),
          indicatorColor: const Color(0xFFF0EBE3),
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) => setState(() => _currentIndex = index),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.kitchen), label: 'Dapur'),
            NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Laporan'),
            NavigationDestination(icon: Icon(Icons.restaurant_menu), label: 'Menu'),
            NavigationDestination(icon: Icon(Icons.qr_code), label: 'QR Meja'),
          ],
        ),
      ),
    );
  }
}
