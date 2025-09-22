import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as reportController from './report.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route   GET /api/reports/fair/:fairId/daily
 * @desc    Obtener reporte diario de una feria
 * @access  Private
 */
router.get('/fair/:fairId/daily', reportController.getFairDailyReport);

/**
 * @route   GET /api/reports/fair/:fairId/date/:date
 * @desc    Obtener reporte de una fecha específica
 * @access  Private
 */
router.get('/fair/:fairId/date/:date', reportController.getDateReport);

export default router;
