const { pool } = require('../config/database');

/**
 * Controlador para gestión de ferias
 */
class FairController {
  
  /**
   * Obtener todas las ferias del usuario
   */
  static async getFairs(req, res) {
    try {
      const userId = req.user.id;
      
      // Primero actualizamos automáticamente los estados basados en fechas
      await pool.execute(`
        UPDATE fairs 
        SET 
          status = CASE 
            WHEN start_date > CURDATE() THEN 'upcoming'
            WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'active'
            WHEN end_date < CURDATE() AND status != 'cancelled' THEN 'completed'
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND status != 'cancelled'
      `, [userId]);
      
      const query = `
        SELECT 
          id,
          name,
          location,
          start_date,
          end_date,
          description,
          status,
          initial_cash_amount,
          expenses,
          created_at,
          updated_at,
          DATEDIFF(start_date, CURDATE()) as days_until_start,
          DATEDIFF(end_date, CURDATE()) as days_until_end
        FROM fairs 
        WHERE user_id = ?
        ORDER BY start_date DESC
      `;
      
      const [fairs] = await pool.execute(query, [userId]);
      
      res.json({
        success: true,
        data: fairs
      });
      
    } catch (error) {
      console.error('Error al obtener ferias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener una feria específica por ID
   */
  static async getFairById(req, res) {
    try {
      const userId = req.user.id;
      const fairId = req.params.id;
      
      // Actualizar el estado de la feria basado en fechas
      await pool.execute(`
        UPDATE fairs 
        SET 
          status = CASE 
            WHEN start_date > CURDATE() THEN 'upcoming'
            WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'active'
            WHEN end_date < CURDATE() AND status != 'cancelled' THEN 'completed'
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND status != 'cancelled'
      `, [fairId, userId]);
      
      const query = `
        SELECT 
          id,
          name,
          location,
          start_date,
          end_date,
          description,
          status,
          initial_cash_amount,
          expenses,
          created_at,
          updated_at,
          DATEDIFF(start_date, CURDATE()) as days_until_start,
          DATEDIFF(end_date, CURDATE()) as days_until_end
        FROM fairs 
        WHERE id = ? AND user_id = ?
      `;
      
      const [fairs] = await pool.execute(query, [fairId, userId]);
      
      if (fairs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feria no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: fairs[0]
      });
      
    } catch (error) {
      console.error('Error al obtener feria:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear una nueva feria
   */
  static async createFair(req, res) {
    try {
      const userId = req.user.id;
      const { name, location, start_date, end_date, description, entry_fee, notes, initial_cash_amount, expenses } = req.body;
      
      // Validaciones
      if (!name || !location || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, ubicación, fecha de inicio y fecha de fin son requeridos'
        });
      }
      
      // Validar que la fecha de fin no sea anterior a la de inicio
      if (new Date(end_date) < new Date(start_date)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
        });
      }
      
      // Validar que las fechas no sean en el pasado
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser en el pasado'
        });
      }
      
      const query = `
        INSERT INTO fairs (user_id, name, location, start_date, end_date, description, entry_fee, notes, initial_cash_amount, expenses)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(query, [
        userId, 
        name, 
        location, 
        start_date, 
        end_date, 
        description || null,
        entry_fee || null,
        notes || null,
        initial_cash_amount || 0,
        expenses || 0
      ]);
      
      // Obtener la feria recién creada
      const [newFair] = await pool.execute(
        'SELECT * FROM fairs WHERE id = ?', 
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        message: 'Feria creada exitosamente',
        data: newFair[0]
      });
      
    } catch (error) {
      console.error('Error al crear feria:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar una feria existente
   */
  static async updateFair(req, res) {
    try {
      const userId = req.user.id;
      const fairId = req.params.id;
      const { name, location, start_date, end_date, description, status, initial_cash_amount, expenses } = req.body;
      
      // Verificar que la feria existe y pertenece al usuario
      const [existingFair] = await pool.execute(
        'SELECT * FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );
      
      if (existingFair.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feria no encontrada'
        });
      }
      
      // Validaciones si se proporcionan nuevas fechas
      if (start_date && end_date) {
        if (new Date(end_date) < new Date(start_date)) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
          });
        }
      }
      
      // Construir query de actualización dinámicamente
      const updates = [];
      const values = [];
      
      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (location) {
        updates.push('location = ?');
        values.push(location);
      }
      if (start_date) {
        updates.push('start_date = ?');
        values.push(start_date);
      }
      if (end_date) {
        updates.push('end_date = ?');
        values.push(end_date);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }
      if (initial_cash_amount !== undefined) {
        updates.push('initial_cash_amount = ?');
        values.push(initial_cash_amount);
      }
      if (expenses !== undefined) {
        updates.push('expenses = ?');
        values.push(expenses);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron campos para actualizar'
        });
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(fairId, userId);
      
      const query = `
        UPDATE fairs 
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `;
      
      await pool.execute(query, values);
      
      // Obtener la feria actualizada
      const [updatedFair] = await pool.execute(
        'SELECT * FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );
      
      res.json({
        success: true,
        message: 'Feria actualizada exitosamente',
        data: updatedFair[0]
      });
      
    } catch (error) {
      console.error('Error al actualizar feria:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar una feria
   */
  static async deleteFair(req, res) {
    try {
      const userId = req.user.id;
      const fairId = req.params.id;
      
      // Verificar que la feria existe y pertenece al usuario
      const [existingFair] = await pool.execute(
        'SELECT * FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );
      
      if (existingFair.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feria no encontrada'
        });
      }
      
      await pool.execute(
        'DELETE FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );
      
      res.json({
        success: true,
        message: 'Feria eliminada exitosamente'
      });
      
    } catch (error) {
      console.error('Error al eliminar feria:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de ferias del usuario
   */
  static async getFairStats(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT 
          COUNT(*) as total_fairs,
          SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END) as upcoming_fairs,
          SUM(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 ELSE 0 END) as active_fairs,
          SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) as completed_fairs,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_fairs,
          COALESCE(SUM(entry_fee), 0) as total_entry_fees
        FROM fairs 
        WHERE user_id = ?
      `;
      
      const [stats] = await pool.execute(query, [userId]);
      
      res.json({
        success: true,
        data: stats[0]
      });
      
    } catch (error) {
      console.error('Error al obtener estadísticas de ferias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualizar gastos de una feria específica
   */
  static async updateFairExpenses(req, res) {
    try {
      const userId = req.user.id;
      const fairId = req.params.id;
      const { expenses } = req.body;

      // Validar que se proporcione el campo expenses
      if (expenses === undefined || expenses === null) {
        return res.status(400).json({
          success: false,
          message: 'El campo expenses es requerido'
        });
      }

      // Validar que expenses sea un número válido
      if (isNaN(parseFloat(expenses)) || parseFloat(expenses) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Los gastos deben ser un número válido mayor o igual a 0'
        });
      }

      // Verificar que la feria existe y pertenece al usuario
      const [existingFair] = await pool.execute(
        'SELECT * FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );

      if (existingFair.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feria no encontrada'
        });
      }

      // Actualizar solo el campo expenses
      const query = `
        UPDATE fairs 
        SET expenses = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;

      await pool.execute(query, [parseFloat(expenses), fairId, userId]);

      // Obtener la feria actualizada
      const [updatedFair] = await pool.execute(
        'SELECT * FROM fairs WHERE id = ? AND user_id = ?',
        [fairId, userId]
      );

      res.json({
        success: true,
        message: 'Gastos actualizados exitosamente',
        data: updatedFair[0]
      });

    } catch (error) {
      console.error('Error al actualizar gastos de feria:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = FairController;
