import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.config.js';
import User from '../users/user.model.js';

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'events',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  fair_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'fairs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: {
        msg: 'El monto total es requerido'
      }
    }
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'mixed'),
    allowNull: false,
    defaultValue: 'cash',
    validate: {
      isIn: {
        args: [['cash', 'card', 'transfer', 'mixed']],
        msg: 'Método de pago debe ser cash, card, transfer o mixed'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'cancelled'),
    allowNull: false,
    defaultValue: 'completed',
    validate: {
      isIn: {
        args: [['completed', 'pending', 'cancelled']],
        msg: 'Estado debe ser completed, pending o cancelled'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sale_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: true
    }
  }
}, {
  tableName: 'sales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_user_date',
      fields: ['user_id', 'sale_date']
    },
    {
      name: 'idx_event',
      fields: ['event_id']
    },
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'fair_id',
      fields: ['fair_id']
    }
  ]
});

export default Sale;
