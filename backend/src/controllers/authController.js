const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { registerSchema, loginSchema } = require('../validations/authValidation');

const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Cek apakah store ada
    const store = await prisma.store.findUnique({
      where: { id: validatedData.storeId },
    });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Warung (Store) tidak ditemukan.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        storeId: validatedData.storeId,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        storeId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Pengguna berhasil terdaftar.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    // Debug: log incoming request body
    console.log('📥 Login attempt:', { body: req.body, contentType: req.headers['content-type'] });

    // Guard: jika body kosong (biasanya karena CORS preflight gagal)
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data login kosong. Pastikan mengirim username dan password.',
      });
    }

    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        storeId: user.storeId,
      },
      process.env.JWT_SECRET || 'supersecretwarmindokey123',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          storeId: user.storeId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
