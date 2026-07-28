'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';

interface MenuItem {
  id: string;
  name: string;
  price: string | number;
  category: 'MAKANAN' | 'MINUMAN';
  isAvailable: boolean;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  menus: MenuItem[];
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface ActiveOrder {
  id: string;
  tableNumber: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
}

type CategoryFilter = 'MAKANAN' | 'MINUMAN' | null;

const C = {
  cream:      '#FAF8F4',
  parchment:  '#F0EBE3',
  sand:       '#E8E0D4',
  caramel:    '#C8A882',
  muted:      '#9A8570',
  terracotta: '#C4622A',
  sienna:     '#8B3E1C',
  espresso:   '#2D1A0A',
  ink:        '#1C1008',
  white:      '#FFFFFF',
  greenLight: '#EDF7F0',
  greenBorder:'#A8D9B8',
  greenText:  '#2D7A4F',
  amberLight: '#FDF6EC',
  amberBorder:'#E8C98A',
  amberText:  '#8B5E1A',
};

const fmt = (n: number) => n.toLocaleString('id-ID');

export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || 'Meja 01';

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Search & Filter State ───────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi(`/stores/${resolvedParams.slug}`);
        setStore(res.data);
      } catch (e: any) {
        setError(e.message || 'Gagal memuat katalog.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.slug]);

  useEffect(() => {
    if (!activeOrder?.id) return;
    const socket = getSocket();
    socket.emit('join:order', { orderId: activeOrder.id });
    socket.on('order:status_updated', (data: any) => {
      setActiveOrder(prev => prev ? {
        ...prev,
        paymentStatus: data.paymentStatus || prev.paymentStatus,
        orderStatus: data.orderStatus || prev.orderStatus,
      } : null);
    });
    return () => { socket.off('order:status_updated'); };
  }, [activeOrder?.id]);

  // ─── Toggle Filter (click same = off) ───────────────────────
  const handleFilterToggle = (cat: 'MAKANAN' | 'MINUMAN') => {
    setActiveFilter(prev => prev === cat ? null : cat);
  };

  // ─── Filtered + Searched Menu ────────────────────────────────
  const filteredMenus = useMemo(() => {
    if (!store?.menus) return [];
    return store.menus.filter(menu => {
      const matchCategory = activeFilter ? menu.category === activeFilter : true;
      const matchSearch = searchQuery.trim() === ''
        ? true
        : menu.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [store?.menus, activeFilter, searchQuery]);

  const addToCart = (menu: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === menu.id);
      if (existing) return prev.map(i => i.menuItemId === menu.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItemId: menu.id, name: menu.name, price: Number(menu.price), quantity: 1, notes: '' }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  };

  const updateNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(i => i.menuItemId === id ? { ...i, notes } : i));
  };

  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async () => {
    if (!store || !cart.length) return;
    try {
      setSubmitting(true);
      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          storeId: store.id,
          tableNumber,
          items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, notes: i.notes || undefined })),
        }),
      });
      setActiveOrder(res.data);
      setShowModal(true);
      setCart([]);
    } catch (e: any) {
      alert(e.message || 'Gagal membuat pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!activeOrder) return;
    try {
      setSubmitting(true);
      await fetchApi(`/orders/${activeOrder.id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: 'PAID' }),
      });
      setActiveOrder(prev => prev ? { ...prev, paymentStatus: 'PAID' } : null);
    } catch (e: any) {
      alert(e.message || 'Gagal simulasi bayar.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
      <div className="text-center space-y-4 fade-in">
        <div className="w-9 h-9 border-2 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: C.terracotta, borderTopColor: 'transparent' }}></div>
        <p className="text-sm" style={{ color: C.muted }}>Memuat menu…</p>
      </div>
    </div>
  );

  // ─── Error ───────────────────────────────────────────────────
  if (error || !store) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.cream }}>
      <div className="max-w-sm w-full text-center p-8 rounded-xl card space-y-3 scale-in">
        <p className="text-2xl">⚠️</p>
        <p className="font-semibold" style={{ color: C.espresso }}>Warung tidak ditemukan</p>
        <p className="text-sm" style={{ color: C.muted }}>{error || 'Pastikan URL atau QR Code sudah benar.'}</p>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen pb-48 max-w-md mx-auto"
      style={{ backgroundColor: C.cream, borderLeft: `1px solid ${C.sand}`, borderRight: `1px solid ${C.sand}` }}
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <header
        className="header-sticky sticky top-0 z-20 px-5 py-3.5 flex items-center justify-between"
      >
        <div>
          <h1 className="font-semibold text-base" style={{ color: C.espresso }}>{store.name}</h1>
          <p className="text-xs" style={{ color: C.muted }}>Pemesanan Langsung</p>
        </div>
        <span className="badge-table">{tableNumber}</span>
      </header>

      {/* ─── Search Bar ─────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-0">
        <div className="relative">
          {/* Icon search */}
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke={C.caramel}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Cari makanan atau minuman…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 pr-10 py-2.5 text-sm"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: C.sand, color: C.muted }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── Filter Buttons ──────────────────────────────────── */}
      <div className="px-5 pt-3 pb-4 flex items-center gap-2">
        {/* Semua (tampil jika salah satu aktif) */}
        <button
          onClick={() => setActiveFilter(null)}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: activeFilter === null ? C.espresso : C.parchment,
            color: activeFilter === null ? C.white : C.muted,
            border: `1px solid ${activeFilter === null ? C.espresso : C.sand}`,
          }}
        >
          Semua
        </button>

        {/* Tombol Makan */}
        <button
          onClick={() => handleFilterToggle('MAKANAN')}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: activeFilter === 'MAKANAN' ? C.terracotta : C.parchment,
            color: activeFilter === 'MAKANAN' ? C.white : C.muted,
            border: `1px solid ${activeFilter === 'MAKANAN' ? C.terracotta : C.sand}`,
          }}
        >
          Makanan
        </button>

        {/* Tombol Minum */}
        <button
          onClick={() => handleFilterToggle('MINUMAN')}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: activeFilter === 'MINUMAN' ? '#2563EB' : C.parchment,
            color: activeFilter === 'MINUMAN' ? C.white : C.muted,
            border: `1px solid ${activeFilter === 'MINUMAN' ? '#2563EB' : C.sand}`,
          }}
        >
          Minuman
        </button>

        {/* Jumlah hasil */}
        <span className="ml-auto text-xs" style={{ color: C.caramel }}>
          {filteredMenus.length} item
        </span>
      </div>

      {/* ─── Menu List ──────────────────────────────────────── */}
      <div className="px-5 space-y-2.5">
        {filteredMenus.length === 0 ? (
          <div className="text-center py-16 space-y-2 fade-in">
            <p className="text-3xl">🔍</p>
            <p className="text-sm font-medium" style={{ color: C.espresso }}>Tidak ada menu ditemukan</p>
            <p className="text-xs" style={{ color: C.muted }}>Coba kata kunci atau kategori lain</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter(null); }}
              className="mt-3 text-xs font-medium underline"
              style={{ color: C.terracotta }}
            >
              Reset pencarian
            </button>
          </div>
        ) : (
          filteredMenus.map((menu) => {
            const inCart = cart.find(i => i.menuItemId === menu.id);
            return (
              <div
                key={menu.id}
                className="menu-card px-4 py-3.5 flex items-center justify-between gap-3 fade-in"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: C.espresso }}>
                    {menu.name}
                  </p>
                  <p className="text-sm mt-0.5 font-semibold" style={{ color: C.terracotta }}>
                    Rp {fmt(Number(menu.price))}
                  </p>
                </div>

                {menu.isAvailable ? (
                  inCart ? (
                    <div
                      className="flex items-center gap-2 rounded-lg px-1 py-1"
                      style={{ border: `1px solid ${C.sand}`, backgroundColor: C.parchment }}
                    >
                      <button
                        onClick={() => updateQty(menu.id, -1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-base font-semibold"
                        style={{ color: C.terracotta }}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-bold" style={{ color: C.espresso }}>
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(menu)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-base font-semibold"
                        style={{ color: C.terracotta }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(menu)}
                      className="btn-primary text-xs px-4 py-2 whitespace-nowrap"
                    >
                      + Tambah
                    </button>
                  )
                ) : (
                  <span
                    className="text-xs px-3 py-1.5 rounded-md whitespace-nowrap"
                    style={{ backgroundColor: C.parchment, color: C.caramel, border: `1px solid ${C.sand}` }}
                  >
                    Habis
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Cart Panel ─────────────────────────────────────── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 cart-panel px-5 pb-6 pt-4 space-y-3 slide-up">
          <div className="w-8 h-1 rounded-full mx-auto" style={{ backgroundColor: C.sand }}></div>

          <div className="max-h-44 overflow-y-auto space-y-2 pr-0.5">
            {cart.map(item => (
              <div
                key={item.menuItemId}
                className="px-3.5 py-2.5 rounded-lg space-y-1.5"
                style={{ backgroundColor: C.parchment, border: `1px solid ${C.sand}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate flex-1 mr-2" style={{ color: C.espresso }}>
                    {item.name}
                    <span className="font-normal ml-1" style={{ color: C.muted }}>×{item.quantity}</span>
                  </span>
                  <span className="text-xs font-bold" style={{ color: C.terracotta }}>
                    Rp {fmt(item.price * item.quantity)}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Catatan: pedas, tanpa bawang…"
                  value={item.notes}
                  onChange={e => updateNotes(item.menuItemId, e.target.value)}
                  className="input-field w-full text-xs px-3 py-1.5"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.sand}` }}>
            <div>
              <p className="text-xs" style={{ color: C.muted }}>Total</p>
              <p className="text-xl font-bold" style={{ color: C.terracotta }}>
                Rp {fmt(totalAmount)}
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="btn-primary px-6 py-3 text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin inline-block"></span>
              )}
              {submitting ? 'Memproses…' : `Pesan (${cartCount}) & Bayar QRIS`}
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal QRIS ─────────────────────────────────────── */}
      {showModal && activeOrder && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 fade-in">
          <div className="modal-card w-full max-w-sm p-7 space-y-5 scale-in">

            {activeOrder.paymentStatus === 'PENDING' ? (
              <>
                <div className="text-center">
                  <span className="badge-pending text-xs">Menunggu Pembayaran</span>
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold" style={{ color: C.espresso }}>Scan & Bayar QRIS</h2>
                  <p className="text-xs" style={{ color: C.muted }}>
                    Untuk <strong style={{ color: C.espresso }}>{tableNumber}</strong>
                  </p>
                </div>

                {/* QR SVG */}
                <div
                  className="rounded-xl p-5 mx-auto w-48 h-48 flex items-center justify-center relative"
                  style={{ backgroundColor: C.white, border: `1px solid ${C.sand}` }}
                >
                  <svg viewBox="0 0 200 200" width="148" height="148">
                    {Array.from({ length: 10 }).map((_, r) =>
                      Array.from({ length: 10 }).map((_, c) => {
                        const filled = (r + c + r * c) % 3 !== 0 || (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3);
                        return filled ? (
                          <rect key={`${r}-${c}`} x={c * 20} y={r * 20} width="18" height="18" rx="2" fill={C.espresso} />
                        ) : null;
                      })
                    )}
                    <rect x="0" y="0" width="58" height="58" rx="8" fill="none" stroke={C.terracotta} strokeWidth="4" />
                    <rect x="10" y="10" width="38" height="38" rx="4" fill={C.terracotta} />
                    <rect x="142" y="0" width="58" height="58" rx="8" fill="none" stroke={C.terracotta} strokeWidth="4" />
                    <rect x="152" y="10" width="38" height="38" rx="4" fill={C.terracotta} />
                    <rect x="0" y="142" width="58" height="58" rx="8" fill="none" stroke={C.terracotta} strokeWidth="4" />
                    <rect x="10" y="152" width="38" height="38" rx="4" fill={C.terracotta} />
                  </svg>
                  <p className="absolute bottom-2 text-center w-full"
                    style={{ fontSize: '9px', color: C.caramel, letterSpacing: '0.1em' }}>
                    WARMINDO BERKAH
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: C.terracotta }}>
                    Rp {fmt(Number(activeOrder.totalAmount))}
                  </p>
                </div>

                <button
                  onClick={handlePay}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                  style={{ backgroundColor: C.greenText, color: C.white }}
                >
                  {submitting ? 'Memverifikasi…' : '✓ Simulasi Bayar QRIS Sukses'}
                </button>
              </>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: C.greenLight, border: `1px solid ${C.greenBorder}` }}
                  >
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold" style={{ color: C.espresso }}>Pembayaran Diterima</h2>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Pesanan <strong style={{ color: C.espresso }}>{tableNumber}</strong> sedang disiapkan.
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-lg px-4 py-3.5 space-y-2"
                  style={{ backgroundColor: C.parchment, border: `1px solid ${C.sand}` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: C.muted }}>Status pesanan</p>
                    {activeOrder.orderStatus === 'COMPLETED' ? (
                      <span className="badge-done">Selesai Diantar</span>
                    ) : (
                      <span className="badge-pending flex items-center gap-1.5">
                        <span className="live-dot"></span>
                        Sedang Dimasak
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    {activeOrder.orderStatus === 'COMPLETED'
                      ? 'Makanan sudah sampai di meja. Selamat menikmati!'
                      : 'Mohon tunggu, pesanan Anda sedang diproses oleh dapur.'}
                  </p>
                </div>

                {activeOrder.orderStatus === 'COMPLETED' && (
                  <button
                    onClick={() => { setShowModal(false); setActiveOrder(null); }}
                    className="btn-secondary w-full py-3 text-sm"
                  >
                    Pesan Menu Lagi
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
