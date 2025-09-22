import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as barcodeController from './barcode.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/barcode/generate - Generar código de barras simple
router.post('/generate', barcodeController.generateBarcode);

// POST /api/barcode/custom - Generar código de barras personalizado
router.post('/custom', barcodeController.generateCustomBarcode);

// POST /api/barcode/validate - Validar código de barras
router.post('/validate', barcodeController.validateBarcode);

// GET /api/barcode/formats - Obtener formatos soportados
router.get('/formats', barcodeController.getSupportedFormats);

export default router;
