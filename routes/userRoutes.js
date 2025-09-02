const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// Perfil do usuário (existente)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar perfil", error: error.message });
  }
});

// Atualizar perfil (existente, ajustado para incluir phone e cpf)
router.put("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.cpf = req.body.cpf || user.cpf;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar perfil", error: error.message });
  }
});

// Atualizar senha (nova rota)
router.put("/security", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    const isMatch = await bcrypt.compare(currentPassword, user.password); // Substitua por lógica real
    if (!isMatch) return res.status(400).json({ message: "Senha atual incorreta" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: "Senha atualizada com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar senha", error: error.message });
  }
});

module.exports = router;