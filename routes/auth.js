const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  console.log('Dados recebidos no login:', { email, password, role });

  const user = await User.findOne({ email, role });
  console.log('Usuário encontrado:', user);
  if (!user) {
    return res.status(400).json({ message: 'Usuário não encontrado' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Senha inválida' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
  console.log('Token gerado:', token);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
}));

const merchantAuth = authMiddleware('merchant');
router.get('/drivers', merchantAuth, asyncHandler(async (req, res) => {
  console.log('Requisição para /api/auth/drivers recebida');
  const drivers = await User.find({ role: 'driver' }).select('name email');
  console.log('Motoristas encontrados:', drivers);
  res.json(drivers);
}));

module.exports = router;

