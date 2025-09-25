const { connectDB, sequelize } = require('./connection');

async function rollback() {
  console.log('🔄 Iniciando rollback de base de datos...');
  
  try {
    // Conectar a la base de datos
    const connected = await connectDB();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Obtener todas las tablas
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    if (tables.length === 0) {
      console.log('⚠️  No hay tablas para eliminar');
      return;
    }

    // Eliminar todas las tablas en orden inverso
    for (const table of tables.reverse()) {
      console.log(`🗑️  Eliminando tabla: ${table.table_name}`);
      await sequelize.query(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE`);
    }

    console.log('✅ Rollback completado exitosamente');
    console.log(`📋 Tablas eliminadas: ${tables.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el rollback:', error.message);
    process.exit(1);
  }
}

// Ejecutar rollback si se llama directamente
if (require.main === module) {
  rollback();
}

module.exports = rollback;
