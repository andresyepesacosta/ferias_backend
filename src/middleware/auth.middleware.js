import passport from 'passport';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

/**
 * Detecta el tipo de cliente basado en headers y User-Agent
 */
export function detectClientType(req) {
  const userAgent = req.headers['user-agent'] || '';
  const clientType = req.headers['x-client-type'] || '';
  const hasAuthHeader = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');

  // Prioridad: Header explícito
  if (clientType === 'mobile' || clientType === 'api') return 'jwt';
  if (clientType === 'web') return 'session';

  // Detectar por Authorization header
  if (hasAuthHeader) return 'jwt';

  // Detectar por User-Agent
  if (userAgent.includes('iPhone') || userAgent.includes('Android') ||
    userAgent.includes('Mobile') || userAgent.includes('ReactNative')) {
    return 'jwt';
  }

  // Por defecto, aplicación web
  return 'session';
}

/**
 * Middleware de autenticación híbrido
 * Usa JWT o Sessions según el tipo de cliente
 */
export const authenticateSession = (req, res, next) => {
  const clientType = detectClientType(req);
  console.log('Detected client type:', clientType);
  if (clientType === 'jwt') {
    // Autenticación JWT para móviles/APIs
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error de autenticación',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o expirado',
          code: 'INVALID_TOKEN'
        });
      }

      req.user = user;
      req.authType = 'jwt';
      next();
    })(req, res, next);

  } else {
    // Autenticación por sesión para web
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada',
        code: 'INVALID_SESSION'
      });
    }

    req.authType = 'session';
    next();
  }
};

/**
 * Middleware de login híbrido
 * Maneja login para ambos tipos de clientes
 */
export const loginHybrid = (req, res, next) => {
  const clientType = detectClientType(req);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Credenciales inválidas'
      });
    }

    if (clientType === 'jwt') {
      // Respuesta JWT para móviles
      const tokenPayload = {
        sub: user.id, // Subject (user ID)
        iat: Math.floor(Date.now() / 1000), // Issued at
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // Expires in 7 days
        jti: generateJTI(), // JWT ID (para blacklist)
        iss: process.env.JWT_ISSUER || 'ferias-app',
        aud: process.env.JWT_AUDIENCE || 'ferias-clients',
        // Claims personalizados
        email: user.email,
        name: user.name,
        provider: user.provider
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);

      return res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url,
            email_verified: user.email_verified
          },
          token,
          expires_in: 7 * 24 * 60 * 60, // segundos
          token_type: 'Bearer'
        }
      });

    } else {
      // Respuesta con sesión para web
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({
            success: false,
            message: 'Error al crear sesión'
          });
        }

        return res.json({
          success: true,
          message: 'Login exitoso',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar_url: user.avatar_url,
              email_verified: user.email_verified
            },
            session: true
          }
        });
      });
    }
  })(req, res, next);
};

/**
 * Middleware de logout híbrido
 */
export const logoutHybrid = async (req, res, next) => {
  const clientType = detectClientType(req);

  if (clientType === 'jwt') {
    // Logout JWT: agregar token a blacklist
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const decoded = jwt.decode(token);
        if (decoded?.jti && decoded?.exp) {
          // Agregar a blacklist hasta que expire
          await pool.execute(
            'INSERT INTO jwt_blacklist (jti, user_id, expires_at) VALUES (?, ?, FROM_UNIXTIME(?))',
            [decoded.jti, decoded.sub, decoded.exp]
          );
        }
      }

      return res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }

  } else {
    // Logout por sesión
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión'
        });
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({
            success: false,
            message: 'Error al destruir sesión'
          });
        }

        res.clearCookie('ferias_session');
        res.json({
          success: true,
          message: 'Logout exitoso'
        });
      });
    });
  }
};

/**
 * Rate limiting específico para autenticación
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: (req) => {
    const clientType = detectClientType(req);
    return clientType === 'jwt' ? 10 : 5; // Más intentos para móviles
  },
  message: (req) => ({
    success: false,
    message: 'Demasiados intentos de login. Intenta en 15 minutos.',
    code: 'RATE_LIMITED'
  }),
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Middleware opcional de autenticación
 */
export const optionalAuth = (req, res, next) => {
  const clientType = detectClientType(req);

  if (clientType === 'jwt') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.authType = null;
      return next();
    }

    return authenticateSession(req, res, next);
  } else {
    req.user = req.isAuthenticated() ? req.user : null;
    req.authType = req.user ? 'session' : null;
    next();
  }
};

// Función auxiliar para generar JWT ID único
function generateJTI() {
  return require('crypto').randomBytes(16).toString('hex');
}
