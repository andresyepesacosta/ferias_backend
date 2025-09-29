import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'provider', 'avatar_url', 'email_verified', 'created_at'],
      raw: true
    });

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    console.error('Error en deserialización de usuario:', error);
    done(error, null);
  }
});

// Estrategia Local (Email/Password)
passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false
}, async (email, password, done) => {
  try {
    if (!email || !password) {
      return done(null, false, {
        message: 'Email y contraseña son requeridos'
      });
    }

    const user = await User.findOne({
      where: {
        email: email.toLowerCase().trim(),
        provider: ['local', 'merged']
      },
      attributes: ['id', 'name', 'email', 'password', 'provider', 'avatar_url',
        'email_verified', 'is_active', 'created_at'],
      raw: true
    });

    if (!user) {
      return done(null, false, {
        message: 'Credenciales inválidas'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return done(null, false, {
        message: 'Credenciales inválidas'
      });
    }

    if (!user.is_active) {
      return done(null, false, {
        message: 'Tu cuenta ha sido desactivada. Contacta soporte.'
      });
    }

    if (!user.email_verified) {
      return done(null, false, {
        message: 'Por favor verifica tu email antes de continuar'
      });
    }

    await User.update(
      { updated_at: new Date() },
      { where: { id: user.id } }
    );

    const { password: _, ...userWithoutPassword } = user;
    return done(null, userWithoutPassword);

  } catch (error) {
    console.error('Error en autenticación local:', error);
    return done(error);
  }
}));

// Estrategia JWT (Mobile/API)
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
  issuer: process.env.JWT_ISSUER || 'ferias-app',
  audience: process.env.JWT_AUDIENCE || 'ferias-clients',
  passReqToCallback: false
}, async (payload, done) => {
  try {
    const userId = payload.sub || payload.id;

    if (!userId) {
      return done(null, false);
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'provider', 'avatar_url',
        'email_verified', 'is_active', 'created_at'],
      raw: true
    });

    if (!user) {
      return done(null, false);
    }

    if (!user.is_active) {
      return done(null, false);
    }

    return done(null, user);

  } catch (error) {
    console.error('Error en verificación JWT:', error);
    return done(error, false);
  }
}));

// Estrategias OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await handleOAuthUser({
        provider: 'google',
        providerId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        accessToken,
        refreshToken
      });

      return done(null, result);
    } catch (error) {
      console.error('Error en Google OAuth:', error);
      return done(error, null);
    }
  }));
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use('facebook', new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'picture.type(large)']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await handleOAuthUser({
        provider: 'facebook',
        providerId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        accessToken,
        refreshToken
      });

      return done(null, result);
    } catch (error) {
      console.error('Error en Facebook OAuth:', error);
      return done(error, null);
    }
  }));
}

// Función auxiliar para OAuth
async function handleOAuthUser({ provider, providerId, email, name, avatar, accessToken, refreshToken }) {
  try {
    const existingOAuthUser = await User.findOne({
      where: {
        provider: provider,
        provider_id: providerId
      },
      raw: true
    });

    if (existingOAuthUser) {
      await User.update(
        { updated_at: new Date() },
        { where: { id: existingOAuthUser.id } }
      );
      return existingOAuthUser;
    }

    if (email) {
      const existingEmailUser = await User.findOne({
        where: { email: email },
        raw: true
      });

      if (existingEmailUser) {
        await User.update({
          provider: 'merged',
          provider_id: providerId,
          avatar_url: avatar || existingEmailUser.avatar_url,
          email_verified: true,
          updated_at: new Date()
        }, {
          where: { id: existingEmailUser.id }
        });

        const updatedUser = await User.findByPk(existingEmailUser.id, { raw: true });
        return updatedUser;
      }
    }

    const newUser = await User.create({
      name: name || `Usuario ${provider}`,
      email: email,
      provider: provider,
      provider_id: providerId,
      avatar_url: avatar,
      email_verified: !!email,
      email_verified_at: email ? new Date() : null,
      is_active: true
    });

    return newUser.get({ plain: true });

  } catch (error) {
    console.error('Error procesando usuario OAuth:', error);
    throw error;
  }
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' };
  }
  return { valid: true, message: 'Contraseña válida' };
};

const detectClientType = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const clientType = req.headers['x-client-type'] || '';
  const hasAuthHeader = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');

  if (clientType === 'mobile' || clientType === 'api') return 'jwt';
  if (clientType === 'web') return 'session';
  if (hasAuthHeader) return 'jwt';
  if (userAgent.includes('iPhone') || userAgent.includes('Android') ||
    userAgent.includes('Mobile') || userAgent.includes('ReactNative')) {
    return 'jwt';
  }
  return 'session';
};

passport.isValidEmail = isValidEmail;
passport.validatePasswordStrength = validatePasswordStrength;
passport.detectClientType = detectClientType;

export default passport;
