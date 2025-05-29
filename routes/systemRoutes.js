const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

router.get("/deliveries/active", authenticateToken, async (req, res) => {
  // Verifique se o usuário tem a role correta (ex.: "Lojista")
  if (req.user.role !== "Lojista") {
    return res.status(403).json({ message: "Acesso negado: função insuficiente" });
  }
  // Lógica para buscar entregas ativas
  res.json([{ id: "1", status: "In Progress", driver: "John" }]);
});

module.exports = router;