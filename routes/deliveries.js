const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');

router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find({ status: { $in: ['pending', 'accepted', 'picked'] } });
    res.json(deliveries);
  } catch (err) {
    console.error('Erro ao listar entregas:', err);
    res.status(500).json({ message: 'Erro ao listar entregas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer, address, items } = req.body;
    const delivery = new Delivery({ customer, address, items });
    await delivery.save();
    res.status(201).json(delivery);
  } catch (err) {
    console.error('Erro ao criar entrega:', err);
    res.status(500).json({ message: 'Erro ao criar entrega' });
  }
});

module.exports = router;