const express = require('express');
     const router = express.Router();
     const Delivery = require('../models/Delivery');

     router.get('/', async (req, res) => {
       try {
         const today = new Date();
         today.setHours(0, 0, 0, 0);

         const deliveriesToday = await Delivery.countDocuments({
           createdAt: { $gte: today },
         });

         const activeDeliveries = await Delivery.countDocuments({
           status: { $in: ['pending', 'accepted', 'picked'] },
         });

         const revenueToday = deliveriesToday * 31.67; // Valor médio fictício por entrega

         res.json({
           deliveriesToday,
           activeDeliveries,
           averageTime: '28 min', // Valor fictício, pode ser calculado com base em dados reais
           revenueToday: revenueToday.toFixed(2),
         });
       } catch (err) {
         console.error('Erro ao buscar estatísticas:', err);
         res.status(500).json({ message: 'Erro ao buscar estatísticas' });
       }
     });

     module.exports = router;