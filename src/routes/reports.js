const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route   GET /api/reports/fair/:fairId/daily
 * @desc    Obtener reporte diario de una feria
 * @access  Private
 */
router.get('/fair/:fairId/daily', ReportsController.getFairDailyReport);

/**
 * @route   GET /api/reports/fair/:fairId/date/:date
 * @desc    Obtener reporte de una fecha específica
 * @access  Private
 */
router.get('/fair/:fairId/date/:date', ReportsController.getDateReport);

module.exports = router;
