const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/despliegue_monolitico',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    return false;
  }
};

// Función para sincronizar modelos
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Modelos sincronizados correctamente.');
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando modelos:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  connectDB,
  syncModels
};
