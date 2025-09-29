import express from 'express';
import * as scannerController from './scanner.controller.js';
import { authenticateSession } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Scanner
 *   description: Funcionalidades de escáner y códigos de barras
 */

router.use(authenticateSession);

/**
 * @swagger
 * /api/v1/scanner/generate:
 *   post:
 *     summary: Generar código de barras
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.post('/generate', scannerController.generateBarcode);



export default router;
