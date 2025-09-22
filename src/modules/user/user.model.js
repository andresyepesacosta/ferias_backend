import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize';
import bcryptjs from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [1, 100]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  business_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  business_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  business_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook', 'apple'),
    allowNull: true,
    defaultValue: 'local'
  },
  provider_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },
  preferred_currency_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: 'ID de la moneda preferida del usuario'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      name: 'idx_email',
      fields: ['email']
    },
    {
      name: 'idx_provider',
      fields: ['provider', 'provider_id']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_city',
      fields: ['city']
    },
    {
      name: 'idx_country',
      fields: ['country']
    },
    {
      name: 'idx_business_type',
      fields: ['business_type']
    },
    {
      name: 'idx_users_currency',
      fields: ['preferred_currency_id']
    }
  ],
  hooks: {
    // Hook para hash password antes de crear usuario
    beforeCreate: async (user) => {
      if (user.password) {
    
        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(user.password, salt);
      }
    },
    // Hook para hash password antes de actualizar usuario
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        
        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(user.password, salt);
      }
    }
  }
});

export default User;
