import express from 'express';
import { authenticateSession } from '../../middleware/auth.middleware.js';
import { validateSchema } from '../../middleware/validation.middleware.js';
import * as productController from './product.controller.js';
import {
  createProductSchema,
  updateProductSchema,
  generateLabelSchema
} from './product.schemas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos
 */

// Middleware de autenticación híbrida para todas las rutas
router.use(authenticateSession);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/:id', productController.getProduct);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.post('/', validateSchema(createProductSchema), productController.createProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.put('/:id', validateSchema(updateProductSchema), productController.updateProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @swagger
 * /api/v1/products/{id}/barcode:
 *   get:
 *     summary: Generar código de barras
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/:id/barcode', productController.generateBarcode);

/**
 * @swagger
 * /api/v1/products/{id}/label:
 *   post:
 *     summary: Generar etiqueta con fechas
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.post('/:id/label', validateSchema(generateLabelSchema), productController.generateProductLabelWithDates);

export default router;
