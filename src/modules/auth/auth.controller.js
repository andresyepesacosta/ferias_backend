import * as authService from './auth.service.js';


export const login = async (req, res, next) => {
  // Validar schema de entrada
  try {
    const { email, password } = req.body;

    // Buscar usuario por email con información de moneda
    const { user, accessToken } = await authService.login({ email, password });

    res.status(200).json({ success: true, user, accessToken });
    
  } catch (error) {
    next(error);
  }
}

export const register = async (req, res, next) => {
  // Validar schema de entrada
  try {
    const { name, email, password, preferred_currency_id } = req.body;

    // Buscar usuario por email con información de moneda
    const { user, accessToken } = await authService.register({ name, email, password, preferred_currency_id });

    res.status(201).json({ success: true, user, accessToken });
    
  } catch (error) {
    next(error);
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { userProfile } = await authService.getProfile({ userId });

    res.status(200).json({ success: true, user: userProfile });
  } catch (error) {
    next(error);
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileChanges = req.body;

    const { userProfile } = await authService.updateProfile({ userId, updates: profileChanges });

    res.status(200).json({ success: true, user: userProfile, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    next(error);
  }
}

export const getUserCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { preferred_currency } = await authService.getUserCurrency({ userId });

    res.status(200).json({ success: true, preferred_currency });
  } catch (error) {
    next(error);
  }
}

export const updateUserCurrency = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preferred_currency_id } = req.body;

    const { preferred_currency } = await authService.updateUserCurrency({ userId, preferred_currency_id });

    res.status(200).json({ success: true, preferred_currency, message: 'Moneda preferida actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

// ============= CONTROLADORES OAUTH =============

// Obtener información del usuario OAuth actual
export const getOAuthUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { user } = await authService.getOAuthUserProfile({ userId });

    res.status(200).json({ 
      success: true, 
      user 
    });

  } catch (error) {
    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    next(error);
  }
};

// Desconectar cuenta OAuth
export const disconnectOAuthProvider = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const userId = req.user.id;

    const { message } = await authService.disconnectOAuthProvider({ userId, provider });

    res.status(200).json({ 
      success: true, 
      message 
    });

  } catch (error) {
    if (error.message.includes('No puedes desconectar') || 
        error.message === 'Usuario no encontrado') {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    next(error);
  }
};

// Callback después de autenticación OAuth exitosa
export const handleOAuthCallback = async (req, res, next) => {
  try {
    // El usuario viene del middleware de Passport
    const { user, token } = await authService.handleOAuthCallback({
      userData: req.user,
      provider: req.user.provider
    });

    // Redireccionar al frontend con el token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=${req.user.provider}`);

  } catch (error) {
    console.error('Error en OAuth callback controller:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=oauth_callback_failed`);
  }
};