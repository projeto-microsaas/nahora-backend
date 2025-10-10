const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Delivery = require('../models/Delivery');
const mongoose = require('mongoose'); // Adicionada a importação

router.get('/', auth, async (req, res) => {
  try {
    const merchantId = req.user.id;
    if (!merchantId) {
      return res.status(400).json({ message: 'ID de usuário não fornecido' });
    }

    const stats = await Delivery.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, // Agrupar por dia
          totalDeliveries: { $sum: 1 },
          pendingDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalRevenue: { $sum: '$totalPrice' }, // Usar totalPrice do modelo Delivery
          averageTime: { $avg: { $ifNull: ['$estimatedArrival', 0] } },
        },
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: '$totalDeliveries' },
          pendingDeliveries: { $sum: '$pendingDeliveries' },
          totalRevenue: { $sum: '$totalRevenue' },
          averageTime: { $avg: '$averageTime' },
          dailyDeliveries: {
            $push: { k: '$_id', v: '$totalDeliveries' },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalDeliveries: 1,
          pendingDeliveries: 1,
          totalRevenue: 1,
          averageTime: { $ifNull: ['$averageTime', 0] },
          dailyDeliveries: { $arrayToObject: '$dailyDeliveries' },
        },
      },
    ]).exec();

    res.json(stats[0] || {
      totalDeliveries: 0,
      pendingDeliveries: 0,
      totalRevenue: 0,
      averageTime: 0,
      dailyDeliveries: {},
    });
  } catch (error) {
    console.error('Erro ao processar /api/stats:', error);
    res.status(500).json({ message: 'Erro ao carregar estatísticas', error: error.message });
  }
});

module.exports = router;