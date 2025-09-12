const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getSalesByFair,
  getSaleDetails,
  createSale,
  searchProducts,
  getFairSalesStats,
  processBarcodeImage,
  getDashboardStats
} = require('../controllers/salesController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas especiales (las más específicas primero)
router.get('/dashboard/stats', getDashboardStats);     // GET /api/sales/dashboard/stats
router.get('/fair/:fairId/stats', getFairSalesStats);  // GET /api/sales/fair/:fairId/stats
router.get('/fair/:fairId', getSalesByFair);           // GET /api/sales/fair/:fairId
router.get('/:saleId/details', getSaleDetails);        // GET /api/sales/:saleId/details
router.get('/:saleId', getSaleDetails);                // GET /api/sales/:saleId (alias)
router.post('/', createSale);                          // POST /api/sales

// Rutas para búsqueda de productos
router.get('/products/search', searchProducts);        // GET /api/sales/products/search?search=term

// Ruta para procesamiento de código de barras (futuro)
router.post('/barcode/process', processBarcodeImage);   // POST /api/sales/barcode/process

module.exports = router;
