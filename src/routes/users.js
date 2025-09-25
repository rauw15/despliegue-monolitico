const express = require('express');
const { User } = require('../models');
const router = express.Router();

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Obtener todos los usuarios (solo para usuarios autenticados)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Obtener un usuario específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Actualizar usuario
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Solo permitir que el usuario actualice su propio perfil
    if (parseInt(id) !== req.user.userId) {
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar este usuario' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    // Actualizar campos si se proporcionan
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Eliminar usuario
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Solo permitir que el usuario elimine su propia cuenta
    if (parseInt(id) !== req.user.userId) {
      return res.status(403).json({ 
        error: 'No tienes permisos para eliminar este usuario' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    await user.destroy();

    res.json({
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router;
