import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.config.js';

const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sales',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      isInt: true,
      notNull: {
        msg: 'La cantidad es requerida'
      }
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: {
        msg: 'El precio unitario es requerido'
      }
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: {
        msg: 'El precio total es requerido'
      }
    }
  }
}, {
  tableName: 'sale_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Solo created_at según el esquema
  indexes: [
    {
      name: 'idx_sale',
      fields: ['sale_id']
    },
    {
      name: 'idx_product',
      fields: ['product_id']
    }
  ],
  hooks: {
    beforeValidate: (saleItem) => {
      // Calcular total_price automáticamente si no se proporciona
      if (saleItem.quantity && saleItem.unit_price && !saleItem.total_price) {
        saleItem.total_price = saleItem.quantity * saleItem.unit_price;
      }
    },
    beforeUpdate: (saleItem) => {
      // Recalcular total_price en actualizaciones
      if (saleItem.changed('quantity') || saleItem.changed('unit_price')) {
        saleItem.total_price = saleItem.quantity * saleItem.unit_price;
      }
    }
  }
});

export default SaleItem;
