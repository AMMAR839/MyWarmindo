const { prisma } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Memulai seeding database Warmindo POS...');

  // 1. Hapus data lama jika ada
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // 2. Buat Store (Warung)
  const store = await prisma.store.create({
    data: {
      name: 'Warmindo Berkah',
      slug: 'warmindo-berkah-api-test',
    },
  });
  console.log('✅ Store created:', store.name, `(${store.slug})`);

  // 3. Buat Meja 01 s/d 10
  const tablesData = [
    'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
    'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10',
  ];
  for (const tableNumber of tablesData) {
    await prisma.table.create({
      data: { tableNumber, storeId: store.id },
    });
  }
  console.log(`✅ ${tablesData.length} Meja created`);

  // 4. Katalog Menu dengan Kategori MAKANAN & MINUMAN
  const menusData = [
    // ── MAKANAN ───────────────────────────────────────────
    { name: 'Indomie Goreng Double + Telur', price: 15000, category: 'MAKANAN', isAvailable: true },
    { name: 'Indomie Rebus Spesial Kornet',  price: 16000, category: 'MAKANAN', isAvailable: true },
    { name: 'Indomie Goreng Original',        price: 12000, category: 'MAKANAN', isAvailable: true },
    { name: 'Nasi Goreng Warmindo Spesial',   price: 18000, category: 'MAKANAN', isAvailable: true },
    { name: 'Nasi Goreng Kampung',            price: 15000, category: 'MAKANAN', isAvailable: true },
    { name: 'Magelangan Telur Ceplok',        price: 17000, category: 'MAKANAN', isAvailable: true },
    { name: 'Indomie + Nasi Lengkap',         price: 20000, category: 'MAKANAN', isAvailable: true },
    { name: 'Roti Bakar Selai',               price: 8000,  category: 'MAKANAN', isAvailable: true },

    // ── MINUMAN ───────────────────────────────────────────
    { name: 'Es Teh Manis Segar',   price: 4000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Teh Panas Manis',      price: 3000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Es Jeruk Peras',       price: 5000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Kopi Hitam Mantap',    price: 4000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Kopi Susu Hangat',     price: 7000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Nutrisari Dingin',     price: 5000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Air Mineral Botol',    price: 3000,  category: 'MINUMAN', isAvailable: true },
    { name: 'Susu UHT Dingin',      price: 5000,  category: 'MINUMAN', isAvailable: true },
  ];

  for (const menu of menusData) {
    await prisma.menuItem.create({
      data: { ...menu, storeId: store.id },
    });
  }
  console.log(`✅ ${menusData.length} Menu Items created (${menusData.filter(m => m.category === 'MAKANAN').length} Makanan, ${menusData.filter(m => m.category === 'MINUMAN').length} Minuman)`);

  // 5. Buat Akun Kasir & Owner
  const hashedPassword = await bcrypt.hash('password123', 10);
  const kasir = await prisma.user.create({
    data: {
      username: 'kasir_ammar',
      password: hashedPassword,
      name: 'Ammar Kasir',
      role: 'KASIR',
      storeId: store.id,
    },
  });
  console.log('✅ Kasir User created:', kasir.username);

  const owner = await prisma.user.create({
    data: {
      username: 'owner_ammar',
      password: hashedPassword,
      name: 'Ammar Owner',
      role: 'OWNER',
      storeId: store.id,
    },
  });
  console.log('✅ Owner User created:', owner.username);

  console.log('\n🎉 SEEDING DATABASE SELESAI!');
  console.log('📋 Credentials: kasir_ammar / owner_ammar — password: password123');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding Gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
