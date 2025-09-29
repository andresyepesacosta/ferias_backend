import { Router } from 'express';
import { authenticateSession } from '../../middleware/auth.middleware.js';
import { validateSchema } from '../../middleware/validation.middleware.js';
import * as userController from './user.controller.js';
import { updateProfileSchema, updateUserCurrencySchema } from './user.schema.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Gestión de perfil de usuario
 */

router.use(authenticateSession);

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     summary: Obtener perfil del usuario
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/v1/user/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.put('/profile', validateSchema(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /api/v1/user/currency:
 *   get:
 *     summary: Obtener moneda preferida
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/currency', userController.getUserCurrency);

/**
 * @swagger
 * /api/v1/user/currency:
 *   put:
 *     summary: Actualizar moneda preferida
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.put('/currency', validateSchema(updateUserCurrencySchema), userController.updateUserCurrency);

export default router;
