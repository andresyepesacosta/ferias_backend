import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Currency } from "../../models/index.js";



const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { accessToken, refreshToken };
}

export const login = async ({ email, password }) => {
  // Buscar usuario por email con información de moneda
  const user = await User.findOne({ where: { email }, include: [{ model: Currency, as: 'preferred_currency' }] });
  if (!user) {
    throw new Error('User not found');
  }
  // Validar contraseña
  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }
  // Generar tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  return { user, accessToken, refreshToken };
}

export const register = async ({ name, email, password, preferred_currency_id }) => {
  // Verificar si el email ya existe
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new Error('Email already in use');
  }
  // Encriptar contraseña
  const hashedPassword = await bcryptjs.hash(password, 10);
  // Crear usuario y obtener la información completa
  const newUser = await User.create({ name, email, password: hashedPassword, preferred_currency_id }, { returning: true });
  // Generar tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id);

  return { user: newUser, accessToken, refreshToken };
}

export const getProfile = async ({ userId }) => {
  // Buscar usuario por ID con información de moneda
  const user = await User.findByPk(userId, { include: [{ model: Currency, as: 'preferred_currency' }] });
  if (!user) {
    throw new Error('User not found');
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
    currency_code: user.currency_code,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
  return { userProfile };
}

export const updateProfile = async ({ userId, updates }) => {
  // Actualizar usuario
  const [updatedRowsCount, [updatedUser]] = await User.update(updates, { where: { id: userId }, returning: true });
  if (updatedRowsCount === 0) {
    throw new Error('User not found or no changes made');
  }
  return { user: updatedUser };
}

// Actualizar moneda preferida del usuario
export const updateUserCurrency = async ({ userId, currencyId }) => {
  // Verificar que la moneda existe y está activa
  const currency = await Currency.findOne({ where: { id: currencyId, is_active: true } });

  if (!currency) {
    throw new Error('Moneda no válida');
  }

  // Actualizar la moneda preferida del usuario
  const [updatedRows] = await User.update(
    { preferred_currency_id: currencyId },
    { where: { id: userId } }
  );

  if (updatedRows === 0) {
    throw new Error('No se pudo actualizar la moneda del usuario');
  }

  return { message: 'Moneda actualizada exitosamente' };
}

// Obtener moneda preferida del usuario con información completa
export const getUserCurrency = async ({ userId }) => {
  const user = await User.findByPk(userId, { include: [{ model: Currency, as: 'preferred_currency' }] });
  if (!user) {
    throw new Error('User not found');
  }
  return { preferred_currency: user.preferred_currency };
}

// ============= SERVICIOS OAUTH =============

// Generar JWT para usuario OAuth
export const generateJWTForUser = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      provider: user.provider || 'local'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
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
      throw new Error('Usuario no encontrado');
    }

    return { user };
  } catch (error) {
    console.error('Error obteniendo datos del usuario OAuth:', error);
    throw new Error('Error al obtener información del usuario');
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
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el usuario no tenga solo OAuth sin contraseña local
    if (user.provider === provider && !user.password) {
      throw new Error('No puedes desconectar tu única forma de autenticación. Configura una contraseña primero.');
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
    console.error('Error desconectando OAuth:', error);
    if (error.message.includes('No puedes desconectar') ||
      error.message.includes('Usuario no encontrado')) {
      throw error;
    }
    throw new Error('Error interno al desconectar la cuenta OAuth');
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
    console.error('Error en OAuth callback:', error);
    throw new Error('Error al procesar autenticación OAuth');
  }
};