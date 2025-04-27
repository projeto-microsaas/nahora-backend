const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const driverAuth = authMiddleware('driver');

router.get('/', driverAuth, asyncHandler(async (req, res) => {
  const orders = await Order.find({ driverId: req.user.id }).populate('driverId', 'name email');
  res.json(orders);
}));

router.put('/:id', driverAuth, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }
  if (order.driverId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  order.status = status;
  await order.save();
  res.json({ message: 'Status atualizado com sucesso', order });
}));

module.exports = router;