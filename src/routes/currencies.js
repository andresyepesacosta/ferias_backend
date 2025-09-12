const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getCurrencies, updateUserCurrency, getUserCurrency } = require('../controllers/currencyController');

// Rutas para monedas
router.get('/currencies', authenticateToken, getCurrencies);
router.get('/user/currency', authenticateToken, getUserCurrency);
router.put('/user/currency', authenticateToken, updateUserCurrency);

module.exports = router;
