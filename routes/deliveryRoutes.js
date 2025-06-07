const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Delivery = require('../models/Delivery');
const deliveryController = require('../controllers/deliveryController');

router.get('/active-deliveries', auth, async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      status: { $in: ['pending', 'accepted', 'picked'] },
      merchantId: req.user.id,
    }).select('customer address status createdAt');
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar entregas ativas', error: error.message });
  }
});

router.post('/deliveries', auth, deliveryController.createDelivery);

router.get('/deliveries/:id', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }
    if (delivery.merchantId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar entrega', error: error.message });
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const onlineCouriers = await Delivery.countDocuments({ status: 'online' }); // Ajuste o modelo se necessário
    const acceptanceTime = '~4 min'; // Substitua por lógica real se disponível
    const systemStatus = onlineCouriers > 0 ? 'Operacional' : 'Indisponível';

    res.status(200).json({
      motoboysOnline: onlineCouriers,
      acceptanceTime,
      status: systemStatus,
    });
  } catch (error) {
    console.error('Erro ao buscar status do sistema:', error);
    res.status(500).json({ message: 'Erro ao buscar status do sistema', error });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      { $match: { merchantId: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ]);

    const deliveriesToday = await Delivery.countDocuments({
      merchantId: req.user.id,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const activeDeliveries = await Delivery.countDocuments({
      merchantId: req.user.id,
      status: { $in: ['pending', 'accepted', 'picked'] },
    });
    const pendingDeliveries = stats.find(s => s.status === 'pending')?.count || 0;
    const inRouteDeliveries = stats.find(s => s.status === 'picked')?.count || 0;
    const dailyRevenue = await Delivery.aggregate([
      { $match: { merchantId: req.user.id, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]).then(result => result[0]?.total || 0);
    const averageTime = 0; // Implementar lógica real para tempo médio

    res.status(200).json({
      deliveriesToday,
      activeDeliveries,
      pendingDeliveries,
      inRouteDeliveries,
      averageTime,
      dailyRevenue,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

module.exports = router;