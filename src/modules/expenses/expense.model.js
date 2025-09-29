import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.config.js';

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del usuario que registra el gasto'
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del evento asociado (opcional)'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La categoría del gasto es requerida'
      },
      len: {
        args: [1, 100],
        msg: 'La categoría debe tener entre 1 y 100 caracteres'
      }
    },
    comment: 'Categoría del gasto (transporte, comida, materiales, etc.)'
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La descripción del gasto es requerida'
      },
      len: {
        args: [1, 300],
        msg: 'La descripción debe tener entre 1 y 300 caracteres'
      }
    },
    comment: 'Descripción detallada del gasto'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El monto debe ser un número decimal válido'
      },
      min: {
        args: [0.01],
        msg: 'El monto debe ser mayor a 0'
      }
    },
    comment: 'Monto del gasto'
  },
  receipt_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'La URL del recibo debe ser válida'
      },
      len: {
        args: [0, 500],
        msg: 'La URL del recibo no puede exceder 500 caracteres'
      }
    },
    comment: 'URL del comprobante o recibo (opcional)'
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'La fecha del gasto debe ser una fecha válida'
      },
      notInFuture(value) {
        if (new Date(value) > new Date()) {
          throw new Error('La fecha del gasto no puede ser en el futuro');
        }
      }
    },
    comment: 'Fecha en que se realizó el gasto'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el gasto está activo (soft delete)'
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false, // No usamos paranoid ya que tenemos is_active
  indexes: [
    {
      name: 'idx_user_date',
      fields: ['user_id', 'expense_date']
    },
    {
      name: 'idx_event',
      fields: ['event_id']
    },
    {
      name: 'idx_category',
      fields: ['category']
    },
    {
      name: 'idx_expense_date',
      fields: ['expense_date']
    },
    {
      name: 'idx_active',
      fields: ['is_active']
    }
  ],
  defaultScope: {
    where: {
      is_active: true
    }
  },
  scopes: {
    withInactive: {
      where: {}
    },
    byCategory: (category) => ({
      where: {
        category: category,
        is_active: true
      }
    }),
    byDateRange: (startDate, endDate) => ({
      where: {
        expense_date: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        },
        is_active: true
      }
    }),
    byEvent: (eventId) => ({
      where: {
        event_id: eventId,
        is_active: true
      }
    })
  }
});

export default Expense;