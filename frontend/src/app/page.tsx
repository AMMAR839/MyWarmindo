import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: '#FAF8F4' }}
    >
      {/* ─── Logo / Brand ─────────────────────────────────────── */}
      <div className="text-center space-y-2 mb-12 fade-in">
        <div
          className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-2xl mb-4"
          style={{ backgroundColor: '#C4622A' }}
        >
          🍜
        </div>
        <p
          className="text-xs tracking-[0.2em] uppercase font-medium"
          style={{ color: '#9A8570' }}
        >
          Warmindo Berkah
        </p>
      </div>

      {/* ─── Konten Utama ─────────────────────────────────────── */}
      <div className="max-w-sm w-full text-center space-y-6 slide-up">
        <h1
          className="text-3xl leading-snug font-semibold tracking-tight"
          style={{ color: '#1C1008' }}
        >
          Pesan langsung<br />dari meja Anda
        </h1>

        <p
          className="text-sm leading-relaxed font-normal"
          style={{ color: '#9A8570' }}
        >
          Pilih menu, bayar via QRIS, dan makanan Anda akan segera disiapkan.
          Tidak perlu antre, tidak perlu install aplikasi.
        </p>

        {/* ─── CTA Button ───────────────────────────────────── */}
        <Link
          href="/order/warmindo-berkah-api-test?table=Meja%2005"
          className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-sm"
        >
          Mulai Pesan dari Meja 05 →
        </Link>
      </div>

      {/* ─── Divider ──────────────────────────────────────────── */}
      <div
        className="w-16 h-px my-12"
        style={{ backgroundColor: '#DDD3C4' }}
      ></div>

      {/* ─── 3 Langkah Simple ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-8 text-center max-w-lg slide-up">
        {[
          { step: '01', title: 'Scan QR Meja', desc: 'Gunakan kamera HP untuk scan kode di meja.' },
          { step: '02', title: 'Pilih Menu', desc: 'Lihat katalog dan tambahkan ke keranjang.' },
          { step: '03', title: 'Bayar QRIS', desc: 'Pembayaran terverifikasi, pesanan langsung diproses.' },
        ].map((item) => (
          <div key={item.step} className="flex-1 space-y-2">
            <p
              className="text-xs tracking-widest uppercase font-semibold"
              style={{ color: '#C4622A' }}
            >
              {item.step}
            </p>
            <p className="text-sm font-semibold" style={{ color: '#2D1A0A' }}>
              {item.title}
            </p>
            <p className="text-xs leading-relaxed font-normal" style={{ color: '#9A8570' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Footer Kecil ────────────────────────────────────── */}
      <p className="mt-16 text-xs font-normal" style={{ color: '#C8A882' }}>
        © 2024 Warmindo Berkah
      </p>
    </main>
  );
}
