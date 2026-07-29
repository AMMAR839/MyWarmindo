const { prisma } = require('../config/db');
const { createMenuSchema, updateMenuSchema, updateAvailabilitySchema } = require('../validations/menuValidation');

const getMenusByStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { all } = req.query; // all=true untuk kasir (termasuk menu habis)

    const whereCondition = { storeId };
    if (all !== 'true') {
      whereCondition.isAvailable = true;
    }

    const menus = await prisma.menuItem.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

const createMenu = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const validatedData = createMenuSchema.parse(req.body);

    const menu = await prisma.menuItem.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        category: validatedData.category,
        isAvailable: validatedData.isAvailable,
        storeId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Menu berhasil ditambahkan.',
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateMenuSchema.parse(req.body);

    const menu = await prisma.menuItem.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        category: validatedData.category,
        isAvailable: validatedData.isAvailable,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Menu berhasil diperbarui.',
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};

const updateMenuAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateAvailabilitySchema.parse(req.body);

    const menu = await prisma.menuItem.update({
      where: { id },
      data: {
        isAvailable: validatedData.isAvailable,
      },
    });

    res.status(200).json({
      success: true,
      message: `Status ketersediaan menu '${menu.name}' berhasil diperbarui.`,
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Optional: Cek apakah menu sedang ada di transaksi aktif sebelum dihapus.
    // Untuk saat ini kita hapus langsung saja.

    await prisma.menuItem.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Menu berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenusByStore,
  createMenu,
  updateMenu,
  updateMenuAvailability,
  deleteMenu,
};
