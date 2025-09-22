import { Sequelize } from 'sequelize';


// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || 'bazar_contabilidad',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '-05:00', // UTC
  }
);

export default sequelize;

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    // Aquí puedes sincronizar modelos si es necesario
    // await sequelize.sync({ alter: true }); // Usar con precaución en producción
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    throw error;
  }
}
