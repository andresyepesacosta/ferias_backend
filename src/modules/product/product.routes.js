import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as productController from './product.controller.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/products - Obtener todos los productos del usuario
router.get('/', productController.getProducts);

// GET /api/products/:id - Obtener un producto específico
router.get('/:id', productController.getProduct);

// POST /api/products - Crear nuevo producto
router.post('/', productController.createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', productController.deleteProduct);

// GET /api/products/:id/barcode - Generar y descargar código de barras
router.get('/:id/barcode', productController.generateBarcode);

// POST /api/products/:id/label - Generar etiqueta completa con fechas opcionales
router.post('/:id/label', productController.generateProductLabelWithDates);

export default router;
