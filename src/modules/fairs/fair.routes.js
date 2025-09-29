import express from 'express';
import { authenticateSession } from '../../middleware/auth.middleware.js';
import { validateSchema } from '../../middleware/validation.middleware.js';
import * as fairController from './fair.controller.js';
import {
  createFairSchema,
  updateFairSchema,
  updateFairExpensesSchema
} from './fair.schemas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fairs
 *   description: Gestión de ferias
 */

router.use(authenticateSession);

/**
 * @swagger
 * /api/v1/fairs:
 *   get:
 *     summary: Obtener todas las ferias
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/', fairController.getFairs);

/**
 * @swagger
 * /api/v1/fairs/stats:
 *   get:
 *     summary: Obtener estadísticas de ferias
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/stats', fairController.getFairStats);

/**
 * @swagger
 * /api/v1/fairs/{id}:
 *   get:
 *     summary: Obtener feria por ID
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/:id', fairController.getFairById);

/**
 * @swagger
 * /api/v1/fairs:
 *   post:
 *     summary: Crear nueva feria
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.post('/', validateSchema(createFairSchema), fairController.createFair);

/**
 * @swagger
 * /api/v1/fairs/{id}:
 *   put:
 *     summary: Actualizar feria
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.put('/:id', validateSchema(updateFairSchema), fairController.updateFair);

/**
 * @swagger
 * /api/v1/fairs/{id}/expenses:
 *   patch:
 *     summary: Actualizar gastos de feria
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.patch('/:id/expenses', validateSchema(updateFairExpensesSchema), fairController.updateFairExpenses);

/**
 * @swagger
 * /api/v1/fairs/{id}:
 *   delete:
 *     summary: Eliminar feria
 *     tags: [Fairs]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.delete('/:id', fairController.deleteFair);

export default router;
