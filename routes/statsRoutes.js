const express = require("express");
const router = express.Router();
const Delivery = require("../models/Delivery");

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Total de entregas do lojista
    const totalDeliveries = await Delivery.countDocuments({ merchantId: req.user.id });

    // Entregas ativas (pending, accepted, picked)
    const activeDeliveries = await Delivery.countDocuments({
      merchantId: req.user.id,
      status: { $in: ["pending", "accepted", "picked"] },
    });

    // Entregas hoje
    const deliveriesToday = await Delivery.countDocuments({
      merchantId: req.user.id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Faturamento do dia (entregas entregues hoje)
    const deliveredToday = await Delivery.aggregate([
      {
        $match: {
          merchantId: req.user.id,
          status: "delivered",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          dailyRevenue: { $sum: "$total" },
        },
      },
    ]);
    const dailyRevenue = deliveredToday.length > 0 ? deliveredToday[0].dailyRevenue : 0;

    // Detalhes das entregas em andamento
    const pendingDeliveries = await Delivery.countDocuments({
      merchantId: req.user.id,
      status: "pending",
    });
    const inRouteDeliveries = await Delivery.countDocuments({
      merchantId: req.user.id,
      status: { $in: ["accepted", "picked"] },
    });

    res.json({
      totalDeliveries,
      activeDeliveries,
      deliveriesToday,
      dailyRevenue,
      pendingDeliveries,
      inRouteDeliveries,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar estatísticas", error });
  }
});

module.exports = router;