const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// Rota para buscar todos os produtos
router.get('/products', auth, async (req, res) => {
  try {
    const products = await Product.find({ merchantId: req.user.id });
    console.log('Produtos encontrados:', products); // Log para depuração
    res.status(200).json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
  }
});

// Rota para criar um produto (para teste)
router.post('/products', auth, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      merchantId: req.user.id,
    };
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
  }
});

module.exports = router;