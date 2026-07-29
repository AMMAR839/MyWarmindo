import 'package:flutter_test/flutter_test.dart';
import 'package:warmindo_pos_mobile/main.dart';

void main() {
  testWidgets('Warmindo POS app should render successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const WarmindoApp());

    // Memastikan judul aplikasi Warmindo POS muncul di halaman login
    expect(find.text('Warmindo POS'), findsOneWidget);
  });
}
