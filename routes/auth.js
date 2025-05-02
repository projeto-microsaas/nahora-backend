const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware para autenticar o token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  console.log('Dados recebidos no login:', { email, password, role });

  try {
    const user = await User.findOne({ email, role });
    if (!user) {
      console.log('Usuário não encontrado:', { email, role });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    console.log('Usuário encontrado:', user);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Senha incorreta para o usuário:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('Login bem-sucedido, token gerado:', token);
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    console.log('Dados do usuário retornados:', user);
    res.json(user);
  } catch (err) {
    console.error('Erro ao obter usuário:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Listar motoristas
router.get('/drivers', authenticateToken, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Motorista' }).select('-password');
    res.json(drivers);
  } catch (err) {
    console.error('Erro ao listar motoristas:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Atualizar usuário
router.put('/user', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;