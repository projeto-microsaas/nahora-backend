const express = require('express');
     const router = express.Router();
     const Product = require('../models/Product');

     router.get('/', async (req, res) => {
       try {
         const products = await Product.find();
         res.json(products);
       } catch (err) {
         console.error('Erro ao listar produtos:', err);
         res.status(500).json({ message: 'Erro ao listar produtos' });
       }
     });

     router.post('/', async (req, res) => {
       try {
         const { name, description, price } = req.body;
         const product = new Product({ name, description, price });
         await product.save();
         res.status(201).json(product);
       } catch (err) {
         console.error('Erro ao criar produto:', err);
         res.status(500).json({ message: 'Erro ao criar produto' });
       }
     });

     router.put('/:id', async (req, res) => {
       try {
         const { name, description, price } = req.body;
         const product = await Product.findByIdAndUpdate(
           req.params.id,
           { name, description, price },
           { new: true }
         );
         if (!product) {
           return res.status(404).json({ message: 'Produto não encontrado' });
         }
         res.json(product);
       } catch (err) {
         console.error('Erro ao atualizar produto:', err);
         res.status(500).json({ message: 'Erro ao atualizar produto' });
       }
     });

     router.delete('/:id', async (req, res) => {
       try {
         const product = await Product.findByIdAndDelete(req.params.id);
         if (!product) {
           return res.status(404).json({ message: 'Produto não encontrado' });
         }
         res.json({ message: 'Produto deletado com sucesso' });
       } catch (err) {
         console.error('Erro ao deletar produto:', err);
         res.status(500).json({ message: 'Erro ao deletar produto' });
       }
     });

     module.exports = router;