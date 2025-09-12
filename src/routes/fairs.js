const express = require('express');
const router = express.Router();
const FairController = require('../controllers/fairController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route   GET /api/fairs
 * @desc    Obtener todas las ferias del usuario
 * @access  Private
 */
router.get('/', FairController.getFairs);

/**
 * @route   GET /api/fairs/stats
 * @desc    Obtener estadísticas de ferias del usuario
 * @access  Private
 */
router.get('/stats', FairController.getFairStats);

/**
 * @route   GET /api/fairs/:id
 * @desc    Obtener una feria específica por ID
 * @access  Private
 */
router.get('/:id', FairController.getFairById);

/**
 * @route   POST /api/fairs
 * @desc    Crear una nueva feria
 * @access  Private
 */
router.post('/', FairController.createFair);

/**
 * @route   PUT /api/fairs/:id
 * @desc    Actualizar una feria existente
 * @access  Private
 */
router.put('/:id', FairController.updateFair);

/**
 * @route   PATCH /api/fairs/:id/expenses
 * @desc    Actualizar gastos de una feria
 * @access  Private
 */
router.patch('/:id/expenses', FairController.updateFairExpenses);

/**
 * @route   DELETE /api/fairs/:id
 * @desc    Eliminar una feria
 * @access  Private
 */
router.delete('/:id', FairController.deleteFair);

module.exports = router;
