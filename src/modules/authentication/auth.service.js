import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { notFound, unauthorized, conflict, badRequest, internal } from "@hapi/boom";
import { User, Currency } from "../../models/index.js";



const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateTokens = (userId) => {
  const tokenPayload = {
    sub: userId, // Subject (user ID) - Estándar JWT
    iat: Math.floor(Date.now() / 1000), // Issued at
    iss: process.env.JWT_ISSUER || 'ferias-app',
    aud: process.env.JWT_AUDIENCE || 'ferias-clients'
  };

  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { accessToken, refreshToken };
}

export const login = async ({ email, password }) => {
  // Buscar usuario por email con información de moneda
  const user = await User.findOne({ where: { email }, include: [{ model: Currency, as: 'preferred_currency' }] });
  if (!user) {
    throw unauthorized('Usuario o contraseña inválidos');
  }
  // Validar contraseña
  const isPasswordValid = await bcryptjs.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw unauthorized('Usuario o contraseña inválidos');
  }
  // Generar tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  return { user, accessToken, refreshToken };
}

export const register = async ({ name, email, password, preferred_currency_id }) => {
  // Verificar si el email ya existe
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw conflict('El email ya está en uso');
  }
  
  const newUser = await User.create({ name, email, password, preferred_currency_id }, { returning: true });
  // Generar tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id);

  return { user: newUser, accessToken, refreshToken };
}

// ============= SERVICIOS OAUTH =============

// Generar JWT para usuario OAuth
export const generateJWTForUser = (user) => {
  const tokenPayload = {
    sub: user.id, // Subject (user ID) - Estándar JWT
    iat: Math.floor(Date.now() / 1000), // Issued at
    iss: process.env.JWT_ISSUER || 'ferias-app',
    aud: process.env.JWT_AUDIENCE || 'ferias-clients',
    // Claims personalizados
    email: user.email,
    name: user.name,
    provider: user.provider || 'local'
  };

  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Obtener información completa del usuario OAuth
export const getOAuthUserProfile = async ({ userId }) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'name', 'email', 'business_name', 'phone',
        'avatar_url', 'provider', 'email_verified', 'created_at'
      ],
      include: [{
        model: Currency,
        as: 'preferred_currency',
        attributes: ['id', 'code', 'name', 'symbol']
      }]
    });

    if (!user) {
      throw notFound('Usuario no encontrado');
    }

    return { user };
  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error obteniendo datos del usuario OAuth:', error);
    throw internal('Error al obtener información del usuario');
  }
};

// Desconectar cuenta OAuth
export const disconnectOAuthProvider = async ({ userId, provider }) => {
  try {
    // Verificar que el usuario existe
    const user = await User.findByPk(userId, {
      attributes: ['id', 'password', 'provider']
    });

    if (!user) {
      throw notFound('Usuario no encontrado');
    }

    // Verificar que el usuario no tenga solo OAuth sin contraseña local
    if (user.provider === provider && !user.password) {
      throw badRequest('No puedes desconectar tu única forma de autenticación. Configura una contraseña primero.');
    }

    // Si es el proveedor principal, cambiar a local
    const updates = {};
    if (user.provider === provider) {
      updates.provider = 'local';
      updates.provider_id = null;
    }

    // Actualizar usuario si es necesario
    if (Object.keys(updates).length > 0) {
      await User.update(updates, { where: { id: userId } });
    }

    // TODO: Eliminar tokens OAuth de tabla oauth_tokens cuando se implemente
    // await OAuthToken.destroy({ where: { user_id: userId, provider } });

    return {
      message: `Cuenta de ${provider} desconectada exitosamente`,
      provider
    };

  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error desconectando OAuth:', error);
    throw internal('Error interno al desconectar la cuenta OAuth');
  }
};

// Crear o actualizar usuario OAuth después de autenticación exitosa
export const handleOAuthCallback = async ({ userData, provider }) => {
  try {
    const { email, name, provider_id, avatar_url } = userData;

    // Buscar usuario existente por email
    let user = await User.findOne({
      where: { email },
      include: [{
        model: Currency,
        as: 'preferred_currency',
        attributes: ['id', 'code', 'name', 'symbol']
      }]
    });

    if (user) {
      // Usuario existe, actualizar información OAuth si es necesario
      const updates = {};
      if (!user.provider || user.provider === 'local') {
        updates.provider = provider;
        updates.provider_id = provider_id;
      }
      if (avatar_url && !user.avatar_url) {
        updates.avatar_url = avatar_url;
      }
      if (!user.email_verified) {
        updates.email_verified = true;
      }

      if (Object.keys(updates).length > 0) {
        await user.update(updates);
        // Refrescar el usuario con los cambios
        await user.reload();
      }
    } else {
      // Crear nuevo usuario OAuth
      user = await User.create({
        name,
        email,
        provider,
        provider_id,
        avatar_url,
        email_verified: true,
        // Obtener moneda por defecto (USD)
        preferred_currency_id: 1 // Asumiendo que USD tiene ID 1
      });

      // Cargar la relación de moneda
      await user.reload({
        include: [{
          model: Currency,
          as: 'preferred_currency',
          attributes: ['id', 'code', 'name', 'symbol']
        }]
      });
    }

    // Generar JWT
    const token = generateJWTForUser(user);

    return { user, token };

  } catch (error) {
    if (error.isBoom) {
      throw error;
    }
    console.error('Error en OAuth callback:', error);
    throw internal('Error al procesar autenticación OAuth');
  }
};