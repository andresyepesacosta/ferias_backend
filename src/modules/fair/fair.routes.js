import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as fairController from './fair.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route   GET /api/fairs
 * @desc    Obtener todas las ferias del usuario
 * @access  Private
 */
router.get('/', fairController.getFairs);

/**
 * @route   GET /api/fairs/stats
 * @desc    Obtener estadísticas de ferias del usuario
 * @access  Private
 */
router.get('/stats', fairController.getFairStats);

/**
 * @route   GET /api/fairs/:id
 * @desc    Obtener una feria específica por ID
 * @access  Private
 */
router.get('/:id', fairController.getFairById);

/**
 * @route   POST /api/fairs
 * @desc    Crear una nueva feria
 * @access  Private
 */
router.post('/', fairController.createFair);

/**
 * @route   PUT /api/fairs/:id
 * @desc    Actualizar una feria existente
 * @access  Private
 */
router.put('/:id', fairController.updateFair);

/**
 * @route   PATCH /api/fairs/:id/expenses
 * @desc    Actualizar gastos de una feria
 * @access  Private
 */
router.patch('/:id/expenses', fairController.updateFairExpenses);

/**
 * @route   DELETE /api/fairs/:id
 * @desc    Eliminar una feria
 * @access  Private
 */
router.delete('/:id', fairController.deleteFair);

export default router;
