const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// GET /api/products - Lista todos os produtos do usuário autenticado
router.get('/', auth, async (req, res) => {
  try {
    // Para listar apenas produtos do usuário autenticado, descomente a linha abaixo:
    // const products = await Product.find({ merchantId: req.user.id });
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
  }
});

// POST /api/products - Cria um novo produto
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
    }
    const product = new Product({
      name,
      price,
      category,
      merchantId: req.user.id,
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
  }
});

// GET /api/products/:id - Busca um produto pelo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, merchantId: req.user.id });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produto', error: error.message });
  }
});

// PUT /api/products/:id - Edita um produto
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;
    const updated = await Product.findOneAndUpdate(
      { _id: id, merchantId: req.user.id },
      { name, price, category },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar produto', error: error.message });
  }
});

// DELETE /api/products/:id - Remove um produto
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Product.deleteOne({ _id: id, merchantId: req.user.id });
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir produto', error: error.message });
  }
});

module.exports = router;