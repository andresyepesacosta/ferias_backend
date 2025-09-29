import express from 'express';
import * as saleController from './sale.controller.js';
import { authenticateSession } from '../../middleware/auth.middleware.js';
import { validateSchema } from '../../middleware/validation.middleware.js';
import {
  createSaleSchema,
  processBarcodeSchema
} from './sale.schemas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Gestión de ventas
 */

/**
 * @swagger
 * /api/v1/sales/dashboard/stats:
 *   get:
 *     summary: Estadísticas del dashboard
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/dashboard/stats', authenticateSession, saleController.getDashboardStats);

/**
 * @swagger
 * /api/v1/sales/fair/{fairId}/stats:
 *   get:
 *     summary: Estadísticas de ventas por feria
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/fair/:fairId/stats', authenticateSession, saleController.getFairSalesStats);

/**
 * @swagger
 * /api/v1/sales/fair/{fairId}:
 *   get:
 *     summary: Obtener ventas por feria
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/fair/:fairId', authenticateSession, saleController.getSalesByFair);

/**
 * @swagger
 * /api/v1/sales/{saleId}/details:
 *   get:
 *     summary: Obtener detalles de venta
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/:saleId/details', authenticateSession, saleController.getSaleDetails);

/**
 * @swagger
 * /api/v1/sales/{saleId}:
 *   get:
 *     summary: Obtener venta por ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/:saleId', authenticateSession, saleController.getSaleDetails);

/**
 * @swagger
 * /api/v1/sales:
 *   post:
 *     summary: Crear nueva venta
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.post('/', authenticateSession, validateSchema(createSaleSchema, 'body'), saleController.createSale);

/**
 * @swagger
 * /api/v1/sales/products/search:
 *   get:
 *     summary: Buscar productos para venta
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/products/search', authenticateSession, saleController.searchProducts);

/**
 * @swagger
 * /api/v1/sales/barcode/process:
 *   post:
 *     summary: Procesar código de barras
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.post('/barcode/process', authenticateSession, validateSchema(processBarcodeSchema, 'body'), saleController.processBarcodeImage);

export default router;
