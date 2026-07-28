import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/kitchen_screen.dart';
import 'screens/qr_generator_screen.dart';
import 'screens/owner_report_screen.dart';

void main() {
  runApp(const WarmindoPosApp());
}

class WarmindoPosApp extends StatelessWidget {
  const WarmindoPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Warmindo POS Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primarySwatch: Colors.orange,
      ),
      home: const MainWrapperScreen(),
    );
  }
}

class MainWrapperScreen extends StatefulWidget {
  const MainWrapperScreen({super.key});

  @override
  State<MainWrapperScreen> createState() => _MainWrapperScreenState();
}

class _MainWrapperScreenState extends State<MainWrapperScreen> {
  bool _isLoggedIn = false;
  int _currentIndex = 0;

  // ID Warung Demo
  final String _storeId = '8eb04259-c0e0-4b97-97f8-7cbf5377df19';
  final String _storeSlug = 'warmindo-berkah-api-test';

  @override
  Widget build(BuildContext context) {
    if (!_isLoggedIn) {
      return LoginScreen(
        onLoginSuccess: () {
          setState(() {
            _isLoggedIn = true;
          });
        },
      );
    }

    final pages = [
      KitchenScreen(storeId: _storeId),
      QrGeneratorScreen(storeSlug: _storeSlug),
      OwnerReportScreen(storeId: _storeId),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: Colors.orangeAccent,
        unselectedItemColor: Colors.slate400,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.soup_kitchen),
            label: 'Dapur Live',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_2),
            label: 'QR Meja',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart),
            label: 'Analytics',
          ),
        ],
      ),
    );
  }
}
