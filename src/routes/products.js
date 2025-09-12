const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  generateBarcode,
  generateProductLabelWithDates
} = require('../controllers/productController');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/products - Obtener todos los productos del usuario
router.get('/', getProducts);

// GET /api/products/:id - Obtener un producto específico
router.get('/:id', getProduct);

// POST /api/products - Crear nuevo producto
router.post('/', createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', deleteProduct);

// GET /api/products/:id/barcode - Generar y descargar código de barras
router.get('/:id/barcode', generateBarcode);

// POST /api/products/:id/label - Generar etiqueta completa con fechas opcionales
router.post('/:id/label', generateProductLabelWithDates);

module.exports = router;
