const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// ======================
// GET /api/deliveries (ativas)
// ======================
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { merchantId: req.user.id };
    if (status) query.status = status;
    else query.status = { $in: ['pending', 'scheduled', 'accepted'] };

    const deliveries = await Delivery.find(query).populate('products');
    res.json(deliveries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar entregas', error: error.message });
  }
});

// ======================
// GET /api/deliveries/history (todas)
// ======================
router.get('/history', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, status = 'all' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = { merchantId: req.user.id };

    // 🔹 Filtro por status (se não for "all")
    if (status !== 'all') {
      query.status = status;
    }

    // 🔹 Busca por cliente, endereço ou ID
    if (search) {
      const orFilters = [
        { customer: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orFilters.push({ _id: search });
      }

      query.$or = orFilters;
    }

    const deliveries = await Delivery.find(query)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 })
      .populate('products');

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de entregas:', error.message, error.stack);
    res.status(500).json({ message: 'Erro ao buscar histórico', error: error.message });
  }
});

// ======================
// GET /api/deliveries/:id
// ======================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'ID de entrega inválido' });

    const delivery = await Delivery.findOne({ _id: id, merchantId: req.user.id }).populate('products');
    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    res.json(delivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar entrega', error: error.message });
  }
});

// ======================
// POST /api/deliveries
// ======================
router.post('/', async (req, res) => {
  try {
    const { customer, phone, address, products, instructions, totalPrice, estimatedArrival } = req.body;
    if (!customer || !phone || !address || !products || !totalPrice || !estimatedArrival)
      return res.status(400).json({ message: 'Campos obrigatórios ausentes' });

    if (!products.every(p => mongoose.Types.ObjectId.isValid(p)))
      return res.status(400).json({ message: 'Um ou mais IDs de produtos são inválidos' });

    const validProducts = await Product.find({ _id: { $in: products }, merchantId: req.user.id });
    if (validProducts.length !== products.length)
      return res.status(400).json({ message: 'Um ou mais produtos não pertencem ao comerciante' });

    const delivery = new Delivery({
      customer, phone, address, products, instructions, totalPrice, estimatedArrival,
      merchantId: req.user.id
    });

    const savedDelivery = await delivery.save();
    req.io.emit('newDelivery', savedDelivery);
    res.status(201).json({ delivery: savedDelivery });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar entrega', error: error.message });
  }
});

// ======================
// POST /api/deliveries/schedule
// ======================
router.post('/schedule', async (req, res) => {
  try {
    const { customer, phone, address, products, instructions, totalPrice, estimatedArrival, scheduledAt } = req.body;
    if (!customer || !phone || !address || !products || !totalPrice || !estimatedArrival || !scheduledAt)
      return res.status(400).json({ message: 'Campos obrigatórios ausentes' });

    if (!products.every(p => mongoose.Types.ObjectId.isValid(p)))
      return res.status(400).json({ message: 'Um ou mais IDs de produtos são inválidos' });

    const validProducts = await Product.find({ _id: { $in: products }, merchantId: req.user.id });
    if (validProducts.length !== products.length)
      return res.status(400).json({ message: 'Um ou mais produtos não pertencem ao comerciante' });

    const delivery = new Delivery({
      customer, phone, address, products, instructions, totalPrice, estimatedArrival,
      merchantId: req.user.id,
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled',
    });

    const savedDelivery = await delivery.save();
    req.io.emit('newDeliveryScheduled', savedDelivery);
    res.status(201).json({ delivery: savedDelivery });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao agendar entrega', error: error.message });
  }
});

// ======================
// PUT /api/deliveries/:id/cancel
// ======================
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'ID de entrega inválido' });

    const delivery = await Delivery.findOne({ _id: id, merchantId: req.user.id });
    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    delivery.status = 'cancelled';
    delivery.reason = reason;
    await delivery.save();

    req.io.emit('deliveryUpdate', { id, status: 'cancelled', reason });
    res.json({ message: 'Entrega cancelada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cancelar entrega', error: error.message });
  }
});

// ======================
// PUT /api/deliveries/delivery-status/:id
// ======================
router.put('/delivery-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'ID de entrega inválido' });

    const delivery = await Delivery.findOne({ _id: id, merchantId: req.user.id });
    if (!delivery) return res.status(404).json({ message: 'Entrega não encontrada' });

    delivery.status = 'completed';
    delivery.note = note;
    delivery.completedAt = new Date();
    await delivery.save();

    req.io.emit('deliveryUpdate', { id, status: 'completed', note });
    res.json({ message: 'Entrega concluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao completar entrega', error: error.message });
  }
});

module.exports = router;
