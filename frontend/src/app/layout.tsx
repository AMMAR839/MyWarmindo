import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Warmindo Berkah — Pesan Langsung dari Meja',
  description: 'Scan QR Code meja, pilih menu, bayar QRIS. Tanpa antre, tanpa install aplikasi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className={`antialiased min-h-screen ${jakarta.className}`} style={{ backgroundColor: '#FAF8F4', color: '#1C1008' }}>
        {children}
      </body>
    </html>
  );
}
