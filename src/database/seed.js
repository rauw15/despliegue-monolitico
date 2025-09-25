const { connectDB, sequelize } = require('./connection');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Iniciando seed de base de datos...');
  
  try {
    // Conectar a la base de datos
    const connected = await connectDB();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Verificar si ya hay datos
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('⚠️  La base de datos ya tiene datos. Saltando seed.');
      return;
    }

    // Crear usuario administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Administrador',
      email: 'admin@example.com',
      password: adminPassword
    });

    // Crear usuarios de ejemplo
    const users = [
      {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: await bcrypt.hash('password123', 10)
      },
      {
        name: 'María García',
        email: 'maria@example.com',
        password: await bcrypt.hash('password123', 10)
      },
      {
        name: 'Carlos López',
        email: 'carlos@example.com',
        password: await bcrypt.hash('password123', 10)
      }
    ];

    for (const userData of users) {
      await User.create(userData);
    }

    console.log('✅ Seed completado exitosamente');
    console.log(`👤 Usuarios creados: ${userCount + users.length + 1}`);
    console.log('🔑 Credenciales de administrador:');
    console.log('   Email: admin@example.com');
    console.log('   Contraseña: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
    process.exit(1);
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seed();
}

module.exports = seed;
