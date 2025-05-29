const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// Listar categorias
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ merchantId: req.user.id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar categorias", error });
  }
});

// Adicionar categoria
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name, merchantId: req.user.id });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: "Erro ao adicionar categoria", error });
  }
});

// Atualizar categoria
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, merchantId: req.user.id });
    if (!category) return res.status(404).json({ message: "Categoria não encontrada" });
    category.name = req.body.name || category.name;
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar categoria", error });
  }
});

module.exports = router;