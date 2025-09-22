import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize.js';
import User from '../user/user.model.js';

const Fair = sequelize.define('Fair', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  entry_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'upcoming'
  },
  initial_cash_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Monto inicial de efectivo con el que se inicia la feria'
  },
  expenses: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Gastos y retiros realizados durante la feria'
  }
}, {
  tableName: 'fairs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'idx_dates',
      fields: ['start_date', 'end_date']
    }
  ]
});

export default Fair;
