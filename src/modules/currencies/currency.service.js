import { notFound, badRequest, internal } from "@hapi/boom";
import User from "../users/user.model.js";
import Currency from "./currency.model.js";

// Obtener todas las monedas activas
export const getAllCurrencies = async () => {
  try {
    const currencies = await Currency.findAll({
      where: { is_active: true },
      attributes: ['id', 'code', 'name', 'symbol', 'decimal_places'],
      order: [['name', 'ASC']]
    });

    return { currencies };
  } catch (error) {
    console.error('Error obteniendo monedas:', error);
    throw internal('Error al obtener las monedas disponibles');
  }
};

// Actualizar moneda preferida del usuario
export const updateUserCurrency = async ({ userId, currencyId }) => {
  // Verificar que la moneda existe y está activa
  const currency = await Currency.findOne({
    where: {
      id: currencyId,
      is_active: true
    }
  });

  if (!currency) {
    throw badRequest('Moneda no válida');
  }

  // Actualizar la moneda preferida del usuario
  const [updatedRows] = await User.update(
    { preferred_currency_id: currencyId },
    { where: { id: userId } }
  );

  if (updatedRows === 0) {
    throw notFound('No se pudo actualizar la moneda del usuario');
  }

  return {
    message: 'Moneda actualizada exitosamente',
    currency
  };
};

// Obtener moneda preferida del usuario con información completa
export const getUserCurrency = async ({ userId }) => {
  const user = await User.findByPk(userId, {
    include: [{
      model: Currency,
      as: 'preferred_currency',
      attributes: ['id', 'code', 'name', 'symbol', 'decimal_places'],
      where: { is_active: true }
    }]
  });

  if (!user) {
    throw notFound('Usuario no encontrado');
  }

  if (!user.preferred_currency) {
    throw badRequest('El usuario no tiene una moneda preferida configurada');
  }

  return {
    currency: user.preferred_currency
  };
};

// Verificar si una moneda está activa y es válida
export const validateCurrency = async ({ currencyId }) => {
  try {
    const currency = await Currency.findOne({
      where: {
        id: currencyId,
        is_active: true
      }
    });

    return {
      isValid: !!currency,
      currency: currency || null
    };

  } catch (error) {
    console.error('Error validando moneda:', error);
    throw internal('Error al validar la moneda');
  }
};

// Obtener moneda por código
export const getCurrencyByCode = async ({ code }) => {
  const currency = await Currency.findOne({
    where: {
      code: code.toUpperCase(),
      is_active: true
    }
  });

  if (!currency) {
    throw notFound(`Moneda con código ${code} no encontrada`);
  }

  return { currency };
};




