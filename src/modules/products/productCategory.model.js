import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.config.js';
import User from '../users/user.model.js';

const ProductCategory = sequelize.define('ProductCategory', {
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
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#1976d2',
    validate: {
      is: /^#[0-9A-F]{6}$/i // Validar formato hexadecimal
    }
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'product_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_user_active',
      fields: ['user_id', 'is_active']
    }
  ]
});

export default ProductCategory;
