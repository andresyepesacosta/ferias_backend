const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { 
  register, 
  login, 
  verifyToken, 
  logout,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (locales)
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/verify', authenticateToken, verifyToken);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Función helper para generar JWT después de OAuth
const generateJWTForUser = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      provider: user.provider 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ============= RUTAS OAUTH =============

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  (req, res) => {
    // Generar JWT para el usuario autenticado
    const token = generateJWTForUser(req.user);
    
    // Redireccionar al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=google`);
  }
);

// Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login?error=facebook_auth_failed' }),
  (req, res) => {
    // Generar JWT para el usuario autenticado
    const token = generateJWTForUser(req.user);
    
    // Redireccionar al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=facebook`);
  }
);

// Apple OAuth
router.get('/apple',
  passport.authenticate('apple')
);

router.post('/apple/callback',
  passport.authenticate('apple', { failureRedirect: '/login?error=apple_auth_failed' }),
  (req, res) => {
    // Generar JWT para el usuario autenticado
    const token = generateJWTForUser(req.user);
    
    // Redireccionar al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=apple`);
  }
);

// Ruta para obtener información del usuario OAuth actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await require('../config/database').pool.execute(
      `SELECT id, name, email, business_name, phone, avatar_url, provider, 
              email_verified, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta para desconectar cuenta OAuth
router.post('/disconnect/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user.id;

    // Verificar que el usuario no tenga solo OAuth sin contraseña local
    const [user] = await require('../config/database').pool.execute(
      'SELECT password, provider FROM users WHERE id = ?',
      [userId]
    );

    if (user[0].provider === provider && !user[0].password) {
      return res.status(400).json({ 
        message: 'No puedes desconectar tu única forma de autenticación. Configura una contraseña primero.' 
      });
    }

    // Eliminar tokens OAuth
    await require('../config/database').pool.execute(
      'DELETE FROM oauth_tokens WHERE user_id = ? AND provider = ?',
      [userId, provider]
    );

    // Si es el proveedor principal, cambiar a local
    if (user[0].provider === provider) {
      await require('../config/database').pool.execute(
        'UPDATE users SET provider = ?, provider_id = NULL WHERE id = ?',
        ['local', userId]
      );
    }

    res.json({ message: `Cuenta de ${provider} desconectada exitosamente` });
  } catch (error) {
    console.error('Error desconectando OAuth:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
