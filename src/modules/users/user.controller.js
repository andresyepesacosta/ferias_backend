import * as userService from './user.service.js';

// Obtener perfil del usuario
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { userProfile } = await userService.getProfile({ userId });

    res.status(200).json({ 
      success: true, 
      data: { user: userProfile } 
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar perfil del usuario
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileChanges = req.body;

    const { userProfile } = await userService.updateProfile({ userId, updates: profileChanges });

    res.status(200).json({ 
      success: true, 
      data: { user: userProfile }, 
      message: 'Perfil actualizado correctamente' 
    });
  } catch (error) {
    next(error);
  }
};

// Obtener moneda preferida del usuario
export const getUserCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { preferred_currency } = await userService.getUserCurrency({ userId });

    res.status(200).json({ 
      success: true, 
      data: preferred_currency 
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar moneda preferida del usuario
export const updateUserCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preferred_currency_id } = req.body;

    const { preferred_currency, message } = await userService.updateUserCurrency({ 
      userId, 
      preferred_currency_id 
    });

    res.status(200).json({ 
      success: true, 
      data: { preferred_currency }, 
      message 
    });
  } catch (error) {
    next(error);
  }
};
