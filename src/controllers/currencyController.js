const { pool } = require('../config/database');

// Obtener todas las monedas activas
const getCurrencies = async (req, res) => {
  try {
    const [currencies] = await pool.execute(
      'SELECT id, code, name, symbol, decimal_places FROM currencies WHERE is_active = true ORDER BY name'
    );

    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Error al obtener monedas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar moneda preferida del usuario
const updateUserCurrency = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currencyId } = req.body;

    // Verificar que la moneda existe y está activa
    const [currency] = await pool.execute(
      'SELECT id FROM currencies WHERE id = ? AND is_active = true',
      [currencyId]
    );

    if (currency.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Moneda no válida'
      });
    }

    // Actualizar la moneda preferida del usuario
    await pool.execute(
      'UPDATE users SET preferred_currency_id = ? WHERE id = ?',
      [currencyId, userId]
    );

    res.json({
      success: true,
      message: 'Moneda actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar moneda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener moneda preferida del usuario con información completa
const getUserCurrency = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(`
      SELECT 
        c.id, c.code, c.name, c.symbol, c.decimal_places
      FROM users u
      JOIN currencies c ON u.preferred_currency_id = c.id
      WHERE u.id = ?
    `, [userId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error al obtener moneda del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getCurrencies,
  updateUserCurrency,
  getUserCurrency
};
