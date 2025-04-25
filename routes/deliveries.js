const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Delivery = require('../models/Delivery');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

router.get('/active', authMiddleware, async (req, res) => {
  try {
    const deliveries = await Delivery.find({ driverId: req.user.id, status: 'active' });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar entregas' });
  }
});

router.get('/completed', authMiddleware, async (req, res) => {
  try {
    const deliveries = await Delivery.find({ driverId: req.user.id, status: 'completed' });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar entregas' });
  }
});

router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, driverId: req.user.id });
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }
    delivery.status = 'completed';
    await delivery.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao marcar entrega como concluída' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ message: 'Apenas comerciantes podem criar entregas' });
    }
    const { pickupAddress, deliveryAddress, recipient, weight, value, driverId } = req.body;
    const delivery = new Delivery({
      pickupAddress,
      deliveryAddress,
      recipient,
      weight,
      value,
      driverId,
      merchantId: req.user.id,
      status: 'active',
    });
    await delivery.save();
    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar entrega' });
  }
});

module.exports = router;