const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const NotificationPreference = require("../models/NotificationPreference");

router.get("/notifications", auth, async (req, res) => {
  try {
    const prefs = await NotificationPreference.findOne({ userId: req.user.id }) || {};
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar notificações", error: error.message });
  }
});

router.put("/notifications", auth, async (req, res) => {
  try {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(prefs);
  } catch (error) {
    res.status(400).json({ message: "Erro ao salvar notificações", error: error.message });
  }
});

module.exports = router;