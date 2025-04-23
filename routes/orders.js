const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  res.json([]);
});

router.post('/', authMiddleware, (req, res) => {
  const { item, quantity, status } = req.body;
  res.json({ id: '1', item, quantity, status });
});

module.exports = router;