const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware para autenticar o token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Listar pedidos (somente do comerciante autenticado)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ merchant: req.user.id })
      .populate('merchant', 'name email')
      .populate('driver', 'name email');
    res.json(orders);
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Criar um pedido
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;
    const order = new Order({
      merchant: req.user.id,
      description,
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Aceitar um pedido (somente motoristas)
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Pedido não pode ser aceito' });

    const user = await User.findById(req.user.id);
    if (user.role !== 'Motorista') return res.status(403).json({ message: 'Apenas motoristas podem aceitar pedidos' });

    order.driver = req.user.id;
    order.status = 'accepted';
    await order.save();
    res.json(order);
  } catch (err) {
    console.error('Erro ao aceitar pedido:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;