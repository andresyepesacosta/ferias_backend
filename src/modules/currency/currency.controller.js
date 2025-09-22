import * as currencyService from './currency.service.js';

// Obtener todas las monedas activas
export const getCurrencies = async (req, res, next) => {
  try {
    const { currencies } = await currencyService.getAllCurrencies();

    res.status(200).json({
      success: true,
      data: currencies
    });

  } catch (error) {
    next(error);
  }
};

// Actualizar moneda preferida del usuario
export const updateUserCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currencyId } = req.body;

    if (!currencyId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la moneda es requerido'
      });
    }

    // Validar que currencyId sea un número
    if (!Number.isInteger(parseInt(currencyId))) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la moneda debe ser un número válido'
      });
    }

    const { message } = await currencyService.updateUserCurrency({ 
      userId, 
      currencyId: parseInt(currencyId) 
    });

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
    if (error.message === 'Moneda no válida' || 
        error.message.includes('no se pudo actualizar')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Obtener moneda preferida del usuario con información completa
export const getUserCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { currency } = await currencyService.getUserCurrency({ userId });

    res.status(200).json({
      success: true,
      data: currency
    });

  } catch (error) {
    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('moneda preferida configurada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Validar si una moneda es válida
export const validateCurrency = async (req, res, next) => {
  try {
    const { currencyId } = req.params;

    if (!currencyId || !Number.isInteger(parseInt(currencyId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de moneda inválido'
      });
    }

    const { isValid, currency } = await currencyService.validateCurrency({ 
      currencyId: parseInt(currencyId) 
    });

    res.status(200).json({
      success: true,
      data: {
        isValid,
        currency
      }
    });

  } catch (error) {
    next(error);
  }
};

// Obtener moneda por código
export const getCurrencyByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code || typeof code !== 'string' || code.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Código de moneda inválido'
      });
    }

    const { currency } = await currencyService.getCurrencyByCode({ code });

    res.status(200).json({
      success: true,
      data: currency
    });

  } catch (error) {
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
