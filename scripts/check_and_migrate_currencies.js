const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bazar_contabilidad',
  port: 3306
};

async function checkAndMigrateCurrencies() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar si la tabla currencies existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'bazar_contabilidad' 
      AND TABLE_NAME = 'currencies'
    `);
    
    if (tables.length === 0) {
      console.log('🚨 Tabla currencies no existe. Ejecutando migración...');
      
      // Leer el archivo de migración
      const migrationPath = path.join(__dirname, '../../database/migration_currencies.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Dividir por declaraciones SQL y ejecutar una por una
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`📝 Ejecutando: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
        }
      }
      
      console.log('✅ Migración de monedas completada exitosamente');
    } else {
      console.log('✅ Tabla currencies ya existe');
    }
    
    // Verificar que hay datos en la tabla
    const [currencies] = await connection.execute('SELECT COUNT(*) as count FROM currencies');
    console.log(`💰 Monedas disponibles: ${currencies[0].count}`);
    
    if (currencies[0].count === 0) {
      console.log('🔄 Insertando datos de monedas por defecto...');
      await connection.execute(`
        INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
        ('COP', 'Peso Colombiano', '$', 0),
        ('USD', 'Dólar Estadounidense', '$', 2),
        ('EUR', 'Euro', '€', 2),
        ('MXN', 'Peso Mexicano', '$', 2),
        ('ARS', 'Peso Argentino', '$', 2),
        ('PEN', 'Sol Peruano', 'S/', 2),
        ('CLP', 'Peso Chileno', '$', 0),
        ('BRL', 'Real Brasileño', 'R$', 2)
      `);
      console.log('✅ Datos de monedas insertados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar el script
checkAndMigrateCurrencies();
