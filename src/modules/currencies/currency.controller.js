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

    const { message } = await currencyService.updateUserCurrency({ 
      userId, 
      currencyId 
    });

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
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

    const { currency } = await currencyService.getCurrencyByCode({ code });

    res.status(200).json({
      success: true,
      data: currency
    });

  } catch (error) {
    next(error);
  }
};
