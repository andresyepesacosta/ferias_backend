import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize.js';

const Currency = sequelize.define('Currency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    comment: 'Código ISO de la moneda (USD, COP, EUR, etc.)'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre completo de la moneda'
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Símbolo de la moneda ($, €, £, etc.)'
  },
  decimal_places: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 2,
    comment: 'Número de decimales para esta moneda'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    comment: 'Si la moneda está disponible para usar'
  }
}, {
  tableName: 'currencies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      name: 'idx_currencies_code',
      fields: ['code']
    },
    {
      name: 'idx_currencies_active',
      fields: ['is_active']
    }
  ],
  hooks: {
  }
});

export default Currency;
