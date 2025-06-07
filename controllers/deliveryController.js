const Delivery = require('../models/Delivery');

const createDelivery = async (req, res) => {
  try {
    console.log('Dados recebidos no backend:', req.body);
    const deliveryData = {
      ...req.body,
      merchantId: req.user.id,
      status: req.body.status || 'pending',
      createdAt: new Date(),
    };

    // Validação dos campos obrigatórios
    if (!deliveryData.customer || !deliveryData.address) {
      return res.status(400).json({ message: 'Campos "customer" e "address" são obrigatórios.' });
    }
    if (!deliveryData.order || !Array.isArray(deliveryData.order.products) || deliveryData.order.products.length === 0) {
      return res.status(400).json({ message: 'A entrega deve conter pelo menos um produto.' });
    }
    if (typeof deliveryData.price !== 'number' || deliveryData.price < 0) {
      return res.status(400).json({ message: 'O preço deve ser um número maior ou igual a zero.' });
    }

    const delivery = new Delivery(deliveryData);
    await delivery.save();
    res.status(201).json(delivery);
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    res.status(500).json({ message: 'Erro ao criar entrega', error: error.message });
  }
};

module.exports = { createDelivery };