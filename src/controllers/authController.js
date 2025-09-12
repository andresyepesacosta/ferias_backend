const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { pool } = require('../config/database');

// Esquemas de validación
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  business_name: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Registro de usuario
const register = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { name, email, password, business_name, phone } = value;

    // Verificar si el email ya existe
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario en la base de datos
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, business_name, phone, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, hashedPassword, business_name || null, phone || null]
    );

    const userId = result.insertId;

    // Generar token
    const token = generateToken(userId);

    // Obtener datos del usuario creado (sin password) con información de moneda
    const [newUser] = await pool.execute(
      `SELECT 
        u.id, u.name, u.email, u.business_name, u.phone, u.address, u.city, 
        u.country, u.business_type, u.business_description, u.website,
        u.preferred_currency_id, c.code as currency_code,
        u.created_at, u.updated_at
       FROM users u
       LEFT JOIN currencies c ON u.preferred_currency_id = c.id
       WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: newUser[0],
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Buscar usuario por email con información de moneda
    const [users] = await pool.execute(
      `SELECT 
        u.id, u.name, u.email, u.password, u.business_name, u.phone, u.address, u.city, 
        u.country, u.business_type, u.business_description, u.website,
        u.preferred_currency_id, c.code as currency_code,
        u.created_at, u.updated_at
       FROM users u
       LEFT JOIN currencies c ON u.preferred_currency_id = c.id
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user.id);

    // Remover password de la respuesta
    delete user.password;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar token
const verifyToken = async (req, res) => {
  try {
    // El middleware ya verificó el token y agregó el usuario a req.user
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Logout (opcional - principalmente para limpiar del lado del cliente)
const logout = async (req, res) => {
  try {
    // En un sistema JWT stateless, el logout se maneja del lado del cliente
    // Aquí podríamos implementar una blacklist de tokens si fuera necesario
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Cambiado de req.user.userId a req.user.id

    const [users] = await pool.execute(
      `SELECT 
        u.id, u.name, u.email, u.business_name, u.phone, u.address, u.city, 
        u.country, u.business_type, u.business_description, u.website,
        u.preferred_currency_id, c.code as currency_code,
        u.created_at, u.updated_at
       FROM users u
       LEFT JOIN currencies c ON u.preferred_currency_id = c.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];
    
    res.json({
      success: true,
      data: {
        user: {
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
          preferred_currency_id: user.preferred_currency_id,
          currency_code: user.currency_code,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar perfil del usuario
const updateProfile = async (req, res) => {
  try {
    console.log('=== DEBUG updateProfile ===');
    console.log('req.user:', req.user);
    const userId = req.user.id; // Cambiado de req.user.userId a req.user.id
    console.log('userId extraído:', userId);

    // Esquema de validación para actualización de perfil
    const updateProfileSchema = Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      business_name: Joi.string().max(100).optional().allow(''),
      phone: Joi.string().max(20).optional().allow(''),
      address: Joi.string().max(255).optional().allow(''),
      city: Joi.string().max(100).optional().allow(''),
      country: Joi.string().max(100).optional().allow(''),
      business_type: Joi.string().max(100).optional().allow(''),
      business_description: Joi.string().max(500).optional().allow(''),
      website: Joi.string().uri().optional().allow('')
    });

    const { error, value } = updateProfileSchema.validate(req.body);
    console.log('Datos validados:', value);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(value).forEach(key => {
      updateFields.push(`${key} = ?`);
      // Convertir cadenas vacías y undefined a null para MySQL
      let fieldValue = value[key];
      if (fieldValue === '' || fieldValue === undefined || fieldValue === null) {
        fieldValue = null;
      }
      updateValues.push(fieldValue);
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    // Añadir updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    console.log('Query:', updateQuery);
    console.log('Values:', updateValues);

    await pool.execute(updateQuery, updateValues);

    // Obtener los datos actualizados con información de moneda
    const [users] = await pool.execute(
      `SELECT 
        u.id, u.name, u.email, u.business_name, u.phone, u.address, u.city, 
        u.country, u.business_type, u.business_description, u.website,
        u.preferred_currency_id, c.code as currency_code,
        u.created_at, u.updated_at
       FROM users u
       LEFT JOIN currencies c ON u.preferred_currency_id = c.id
       WHERE u.id = ?`,
      [userId]
    );

    const user = users[0];
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: {
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
          preferred_currency_id: user.preferred_currency_id,
          currency_code: user.currency_code,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  logout,
  getProfile,
  updateProfile
};
