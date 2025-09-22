import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as saleController from './sale.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas especiales (las más específicas primero)
router.get('/dashboard/stats', saleController.getDashboardStats);     // GET /api/sales/dashboard/stats
router.get('/fair/:fairId/stats', saleController.getFairSalesStats);  // GET /api/sales/fair/:fairId/stats
router.get('/fair/:fairId', saleController.getSalesByFair);           // GET /api/sales/fair/:fairId
router.get('/:saleId/details', saleController.getSaleDetails);        // GET /api/sales/:saleId/details
router.get('/:saleId', saleController.getSaleDetails);                // GET /api/sales/:saleId (alias)
router.post('/', saleController.createSale);                          // POST /api/sales

// Rutas para búsqueda de productos
router.get('/products/search', saleController.searchProducts);        // GET /api/sales/products/search?search=term

// Ruta para procesamiento de código de barras (futuro)
router.post('/barcode/process', saleController.processBarcodeImage);   // POST /api/sales/barcode/process

export default router;
