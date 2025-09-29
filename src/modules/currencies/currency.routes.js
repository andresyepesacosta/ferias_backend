import express from 'express';
import { authenticateSession } from '../../middleware/auth.middleware.js';
import { validateSchema } from '../../middleware/validation.middleware.js';
import * as currencyController from './currency.controller.js';
import {
  updateUserCurrencySchema,
  currencyIdParamSchema,
  currencyCodeParamSchema
} from './currency.schemas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Currencies
 *   description: Gestión de monedas
 */

router.use(authenticateSession);

/**
 * @swagger
 * /api/v1/currencies:
 *   get:
 *     summary: Obtener todas las monedas
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/', currencyController.getCurrencies);

/**
 * @swagger
 * /api/v1/currencies/user/currency:
 *   get:
 *     summary: Obtener moneda del usuario
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/user/currency', currencyController.getUserCurrency);

/**
 * @swagger
 * /api/v1/currencies/user/currency:
 *   put:
 *     summary: Actualizar moneda del usuario
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.put('/user/currency', validateSchema(updateUserCurrencySchema), currencyController.updateUserCurrency);

/**
 * @swagger
 * /api/v1/currencies/validate/{currencyId}:
 *   get:
 *     summary: Validar moneda por ID
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/validate/:currencyId', validateSchema(currencyIdParamSchema, 'params'), currencyController.validateCurrency);

/**
 * @swagger
 * /api/v1/currencies/code/{code}:
 *   get:
 *     summary: Obtener moneda por código
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 */
router.get('/code/:code', validateSchema(currencyCodeParamSchema, 'params'), currencyController.getCurrencyByCode);

export default router;
