const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

// Middleware para verificar se o usuário é um comerciante
const authMiddleware = require('../middleware/auth'); // Vamos criar esse middleware

// Criar um novo pedido (apenas para comerciantes)
router.post('/', authMiddleware('merchant'), async (req, res) => {
  const { customerName, items, driverId } = req.body;
  try {
    // Verificar se o driverId existe e é um motorista
    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({ message: 'Motorista inválido' });
      }
    }
    const order = new Order({
      customerName,
      items,
      driverId: driverId || null, // Pode ser nulo se não houver motorista atribuído
      status: driverId ? 'assigned' : 'pending',
    });
    await order.save();
    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Listar pedidos (para comerciantes)
router.get('/', authMiddleware('merchant'), async (req, res) => {
  try {
    const orders = await Order.find().populate('driverId', 'name email');
    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;