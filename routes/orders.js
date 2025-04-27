const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const merchantAuth = authMiddleware('merchant');

router.post('/', merchantAuth, asyncHandler(async (req, res) => {
  const { customerName, items, driverId } = req.body;
  if (!customerName || !items) {
    return res.status(400).json({ message: 'Nome do cliente e itens são obrigatórios' });
  }
  if (typeof customerName !== 'string' || typeof items !== 'string') {
    return res.status(400).json({ message: 'Nome do cliente e itens devem ser strings' });
  }
  if (driverId) {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ message: 'Motorista inválido' });
    }
  }
  const order = new Order({
    customerName,
    items,
    driverId: driverId || null,
    status: driverId ? 'assigned' : 'pending',
  });
  await order.save();
  res.status(201).json({ message: 'Pedido criado com sucesso', order });
}));

router.get('/', merchantAuth, asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('driverId', 'name email');
  res.json(orders);
}));

module.exports = router;