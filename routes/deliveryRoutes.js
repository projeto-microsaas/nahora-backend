const express = require("express");
const router = express.Router();
const Delivery = require("../models/Delivery");

// Criar entrega
router.post("/", async (req, res) => {
  try {
    const { customer, address, items, total } = req.body;
    const delivery = new Delivery({ customer, address, items, total, merchantId: req.user.id });
    await delivery.save();
    res.status(201).json(delivery);
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar entrega", error });
  }
});

// Listar todas as entregas
router.get("/", async (req, res) => {
  try {
    const deliveries = await Delivery.find({ merchantId: req.user.id });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar entregas", error });
  }
});

// Detalhes de entrega
router.get("/:id", async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!delivery) return res.status(404).json({ message: "Entrega não encontrada" });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar entrega", error });
  }
});

// Listar entregas ativas
router.get("/active", async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      merchantId: req.user.id,
      status: { $in: ["pending", "accepted", "picked"] },
    }).sort({ createdAt: -1 }); // Ordenar por mais recente

    // Formatar os dados para o frontend
    const formattedDeliveries = deliveries.map((delivery) => {
      const timeAgo = Math.round((Date.now() - delivery.createdAt) / (1000 * 60)); // Tempo em minutos
      return {
        id: delivery._id,
        name: delivery.customer,
        address: delivery.address,
        status: delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1), // Ex.: "pending" -> "Pending"
        timeAgo,
      };
    });

    res.json(formattedDeliveries);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar entregas ativas", error });
  }
});

module.exports = router;