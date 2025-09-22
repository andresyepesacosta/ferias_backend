import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize.js';

const Product = sequelize.define('Product', {
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
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'product_categories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: {
        msg: 'El precio es requerido'
      }
    }
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  min_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      len: [0, 100]
    }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
      len: [0, 500]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  currency_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    references: {
      model: 'currencies',
      key: 'id'
    },
    comment: 'ID de la moneda del producto'
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_user_active',
      fields: ['user_id', 'is_active']
    },
    {
      name: 'idx_category',
      fields: ['category_id']
    },
    {
      name: 'idx_barcode',
      fields: ['barcode']
    },
    {
      name: 'idx_sku',
      fields: ['sku']
    },
    {
      name: 'idx_products_currency',
      fields: ['currency_id']
    },
    {
      name: 'idx_product_barcode',
      fields: ['barcode']
    }
  ]
});

export default Product;
