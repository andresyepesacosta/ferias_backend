import express from 'express';
import * as reportController from './report.controller.js';
import { authenticateSession } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reportes y estadísticas
 */

/**
 * @swagger
 * /api/v1/reports/fair/{fairId}/daily:
 *   get:
 *     summary: Reporte diario de feria
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/fair/:fairId/daily', authenticateSession, reportController.getFairDailyReport);

/**
 * @swagger
 * /api/v1/reports/fair/{fairId}/date/{date}:
 *   get:
 *     summary: Reporte por fecha específica
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/fair/:fairId/date/:date', authenticateSession, reportController.getDateReport);

export default router;
