// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');

// GET /api/products - listar produtos do comerciante
router.get('/', async (req, res) => {
  try {
    const merchantId = req.user?.id;
    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ message: 'ID do comerciante inválido ou não fornecido' });
    }

    const products = await Product.find({ merchantId });
    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
  }
});

// POST /api/products - criar novo produto
router.post('/', async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const merchantId = req.user?.id;

    if (!name || !price) {
      return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
    }
    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ message: 'ID do comerciante inválido.' });
    }

    const newProduct = new Product({ name, price, category, merchantId });
    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
  }
});

// DELETE /api/products/:id - remover produto
router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const merchantId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ID de produto inválido' });
    }

    const deleted = await Product.findOneAndDelete({ _id: productId, merchantId });
    if (!deleted) {
      return res.status(404).json({ message: 'Produto não encontrado ou não pertence a este comerciante' });
    }

    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro ao excluir produto', error: error.message });
  }
});

module.exports = router;
