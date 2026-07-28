const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Server Error:', err);

  // Error dari Validasi Zod
  if (err instanceof ZodError || err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validasi data gagal.',
      errors: (err.errors || err.issues || []).map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message,
      })),
    });
  }

  // Error dari Prisma Duplicate Entry
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `Data dengan nilai pada field '${err.meta?.target}' sudah ada.`,
    });
  }

  // General Error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
};

module.exports = errorHandler;
