const { prisma } = require('../config/db');
const { createStoreSchema, createTableSchema } = require('../validations/storeValidation');

const createStore = async (req, res, next) => {
  try {
    const validatedData = createStoreSchema.parse(req.body);

    const store = await prisma.store.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Warung berhasil dibuat.',
      data: store,
    });
  } catch (error) {
    next(error);
  }
};

const getStoreBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        tables: true,
        menus: {
          where: { isAvailable: true },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Warung tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
};

const createTable = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const validatedData = createTableSchema.parse(req.body);

    const table = await prisma.table.create({
      data: {
        tableNumber: validatedData.tableNumber,
        storeId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Meja berhasil ditambahkan.',
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

const getTablesByStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const tables = await prisma.table.findMany({
      where: { storeId },
      orderBy: { tableNumber: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStore,
  getStoreBySlug,
  createTable,
  getTablesByStore,
};
