const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Simulação de dados estatísticos (substitua por lógica real)
    const stats = {
      deliveriesToday: 5,
      activeDeliveries: 3,
      averageTime: "25 min",
      revenueToday: 150.00,
      driversOnline: 2,
      acceptanceTime: "5 min",
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar estatísticas", error: error.message });
  }
});

module.exports = router;