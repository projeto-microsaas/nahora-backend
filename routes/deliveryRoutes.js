const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// GET /api/deliveries/history - Lista o histórico de entregas com paginação e busca
router.get('/history', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sort = 'createdAt' } = req.query;
    const merchantId = req.user.id;

    console.log('Parâmetros de busca:', { search, page, limit, sort, merchantId });

    const query = { merchantId };
    if (search && search.trim() !== '') {
      query.$or = [
        { customer: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
      ];
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        query.$or.push({ _id: mongoose.Types.ObjectId(search.trim()) });
      }
    }

    const total = await Delivery.countDocuments(query);
    const deliveries = await Delivery.find(query)
      .sort({ [sort]: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ deliveries, total, page, limit });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico', error: error.message });
  }
});

// GET /api/deliveries/:id - Busca uma entrega específica
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada ou não autorizada' });
    }
    res.json(delivery);
  } catch (error) {
    console.error('Erro ao buscar entrega por ID:', error);
    res.status(500).json({ message: 'Erro ao buscar entrega', error: error.message });
  }
});

// GET /api/deliveries - Lista todas as entregas do usuário autenticado
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find({ merchantId: req.user.id });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar entregas', error: error.message });
  }
});

// POST /api/deliveries - Cria uma nova entrega
router.post('/', async (req, res) => {
  try {
    const { customer, phone, address, products, instructions, totalPrice, estimatedArrival } = req.body;
    const merchantId = req.user.id;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'A entrega deve conter pelo menos um produto' });
    }

    if (!merchantId) {
      return res.status(400).json({ message: 'ID do comerciante não fornecido' });
    }

    const productDocs = await Product.find({ _id: { $in: products } });
    if (productDocs.length !== products.length) {
      return res.status(400).json({ message: 'Um ou mais produtos não encontrados' });
    }

    const calculatedTotal = productDocs.reduce((sum, p) => sum + p.price, 0);
    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      return res.status(400).json({ message: 'O totalPrice fornecido não corresponde ao cálculo dos produtos' });
    }

    if (estimatedArrival && (isNaN(estimatedArrival) || estimatedArrival <= 0)) {
      return res.status(400).json({ message: 'EstimatedArrival deve ser um número positivo' });
    }

    const delivery = new Delivery({
      customer,
      phone,
      address,
      products,
      merchantId,
      totalPrice,
      estimatedArrival: estimatedArrival || 15,
      instructions,
      status: 'pending',
    });

    await delivery.save();
    req.io.emit('newDelivery', { deliveryId: delivery._id, message: 'Nova entrega disponível' });
    res.status(201).json({ message: 'Entrega solicitada com sucesso', delivery });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    res.status(500).json({ message: 'Erro ao criar entrega', error: error.message });
  }
});

// POST /api/deliveries/schedule - Agendar uma nova entrega
router.post('/schedule', async (req, res) => {
  try {
    const { customer, phone, address, products, instructions, totalPrice, scheduledAt } = req.body;
    const merchantId = req.user.id;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'A entrega deve conter pelo menos um produto' });
    }

    if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
      return res.status(400).json({ message: 'Data de agendamento inválida' });
    }

    const productDocs = await Product.find({ _id: { $in: products } });
    if (productDocs.length !== products.length) {
      return res.status(400).json({ message: 'Um ou mais produtos não encontrados' });
    }

    const calculatedTotal = productDocs.reduce((sum, p) => sum + p.price, 0);
    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      return res.status(400).json({ message: 'O totalPrice fornecido não corresponde ao cálculo dos produtos' });
    }

    const delivery = new Delivery({
      customer,
      phone,
      address,
      products,
      merchantId,
      totalPrice,
      scheduledAt: new Date(scheduledAt),
      instructions,
      status: 'scheduled',
    });

    await delivery.save();
    req.io.to('deliverer_all').emit('newDeliveryScheduled', { deliveryId: delivery._id, scheduledAt: delivery.scheduledAt });
    res.status(201).json({ message: 'Entrega agendada com sucesso', delivery });
  } catch (error) {
    console.error('Erro ao agendar entrega:', error);
    res.status(500).json({ message: 'Erro ao agendar entrega', error: error.message });
  }
});

// GET /api/deliveries/nearby - Lista entregas próximas para entregadores
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query; // Radius em metros (padrão: 5km)
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Latitude e longitude são obrigatórias' });
    }

    const deliveries = await Delivery.find({
      status: 'scheduled',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(radius),
        },
      },
    }).limit(10);

    res.json(deliveries);
  } catch (error) {
    console.error('Erro ao buscar entregas próximas:', error);
    res.status(500).json({ message: 'Erro ao buscar entregas próximas', error: error.message });
  }
});

// PUT /api/deliveries/:id/accept - Aceita uma entrega
router.put('/:id/accept', async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, status: 'scheduled' },
      { status: 'accepted', courierId: req.user.id }, // Assume que req.user.id é o ID do entregador
      { new: true }
    );
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada ou já aceita' });
    }
    req.io.to(delivery.merchantId).emit('deliveryUpdate', { deliveryId: delivery._id, status: 'accepted' });
    res.json({ message: 'Entrega aceita com sucesso', delivery });
  } catch (error) {
    console.error('Erro ao aceitar entrega:', error);
    res.status(500).json({ message: 'Erro ao aceitar entrega', error: error.message });
  }
});

// PUT /api/deliveries/:id/cancel - Cancela uma entrega
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.user.id, status: { $in: ['pending', 'scheduled'] } },
      { status: 'cancelled', reason },
      { new: true }
    );
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada ou não pode ser cancelada' });
    }
    req.io.to(delivery.merchantId).emit('deliveryUpdate', { deliveryId: delivery._id, status: 'cancelled', reason });
    res.json({ message: 'Entrega cancelada com sucesso', delivery });
  } catch (error) {
    console.error('Erro ao cancelar entrega:', error);
    res.status(500).json({ message: 'Erro ao cancelar entrega', error: error.message });
  }
});

// PUT /api/deliveries/:id/complete - Conclui uma entrega
router.put('/:id/complete', async (req, res) => {
  try {
    const { note } = req.body;
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, status: 'accepted', courierId: req.user.id },
      { status: 'completed', completedAt: new Date(), note },
      { new: true }
    );
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada ou não pode ser concluída' });
    }
    req.io.to(delivery.merchantId).emit('deliveryUpdate', { deliveryId: delivery._id, status: 'completed', note });
    res.json({ message: 'Entrega concluída com sucesso', delivery });
  } catch (error) {
    console.error('Erro ao concluir entrega:', error);
    res.status(500).json({ message: 'Erro ao concluir entrega', error: error.message });
  }
});

module.exports = router;