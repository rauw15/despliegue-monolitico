const { connectDB, syncModels } = require('./connection');
const { User } = require('../models');

async function migrate() {
  console.log('🔄 Iniciando migración de base de datos...');
  
  try {
    // Conectar a la base de datos
    const connected = await connectDB();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Sincronizar modelos (crear tablas si no existen)
    const synced = await syncModels(false);
    if (!synced) {
      throw new Error('Error sincronizando modelos');
    }

    console.log('✅ Migración completada exitosamente');
    
    // Verificar que las tablas se crearon correctamente
    const { sequelize } = require('./connection');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('📋 Tablas creadas:', results.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrate();
}

module.exports = migrate;
