import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as currencyController from './currency.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/currencies - Obtener todas las monedas disponibles
router.get('/', currencyController.getCurrencies);

// GET /api/currencies/user/currency - Obtener moneda preferida del usuario
router.get('/user/currency', currencyController.getUserCurrency);

// PUT /api/currencies/user/currency - Actualizar moneda preferida del usuario
router.put('/user/currency', currencyController.updateUserCurrency);

export default router;
