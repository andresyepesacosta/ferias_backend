import { User } from '../../models/index.js';
import Currency from '../currencies/currency.model.js';
import { notFound, badRequest } from '@hapi/boom';

// Obtener perfil del usuario
export const getProfile = async ({ userId }) => {
  // Buscar usuario por ID con información de moneda
  const user = await User.findByPk(userId, { 
    include: [{ 
      model: Currency, 
      as: 'preferred_currency' 
    }] 
  });
  
  if (!user) {
    throw notFound('Usuario no encontrado');
  }
  
  const userProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    business_name: user.business_name,
    phone: user.phone,
    address: user.address,
    city: user.city,
    country: user.country,
    business_type: user.business_type,
    business_description: user.business_description,
    website: user.website,
    preferred_currency: user.preferred_currency,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  
  return { userProfile };
};

// Actualizar perfil del usuario
export const updateProfile = async ({ userId, updates }) => {
  // Actualizar usuario
  const [updatedRowsCount] = await User.update(updates, { where: { id: userId } });
  if (updatedRowsCount === 0) {
    throw notFound('Usuario no encontrado o no se realizaron cambios');
  }

  // Obtener el usuario actualizado con información de moneda
  const updatedUser = await User.findByPk(userId, { 
    include: [{ 
      model: Currency, 
      as: 'preferred_currency' 
    }] 
  });

  const userProfile = {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    business_name: updatedUser.business_name,
    phone: updatedUser.phone,
    address: updatedUser.address,
    city: updatedUser.city,
    country: updatedUser.country,
    business_type: updatedUser.business_type,
    business_description: updatedUser.business_description,
    website: updatedUser.website,
    preferred_currency: updatedUser.preferred_currency,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at
  };

  return { userProfile };
};

// Actualizar moneda preferida del usuario
export const updateUserCurrency = async ({ userId, preferred_currency_id }) => {
  // Verificar que la moneda existe y está activa
  const currency = await Currency.findOne({ 
    where: { 
      id: preferred_currency_id, 
      is_active: true 
    } 
  });

  if (!currency) {
    throw badRequest('Moneda no válida');
  }

  // Actualizar la moneda preferida del usuario
  const [updatedRows] = await User.update(
    { preferred_currency_id: preferred_currency_id },
    { where: { id: userId } }
  );

  if (updatedRows === 0) {
    throw notFound('No se pudo actualizar la moneda del usuario');
  }

  // Obtener la moneda actualizada con información completa
  const updatedUser = await User.findByPk(userId, { 
    include: [{ 
      model: Currency, 
      as: 'preferred_currency' 
    }] 
  });

  return { 
    preferred_currency: updatedUser.preferred_currency,
    message: 'Moneda actualizada exitosamente' 
  };
};

// Obtener moneda preferida del usuario con información completa
export const getUserCurrency = async ({ userId }) => {
  const user = await User.findByPk(userId, { 
    include: [{ 
      model: Currency, 
      as: 'preferred_currency' 
    }] 
  }, { raw: true });

  if (!user) {
    throw notFound('Usuario no encontrado');
  }
  
  return { 
    preferred_currency: user.preferred_currency 
  };
};
