require('dotenv').config();

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Middleware para verificar o token JWT
const authMiddleware = asyncHandler(async (req, res, next) => {
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contém { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
});

// Endpoint para obter os dados do usuário autenticado
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  console.log('Buscando usuário no banco de dados...');
  const user = await User.findById(req.user.id).select('-password'); // Não retorna a senha
  console.log('Usuário encontrado:', user);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  });
}));

// Endpoint para login
router.post('/login', asyncHandler(async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Dados recebidos no login:', { email, password, role });

    if (!email || !password || !role) {
      console.log('Campos obrigatórios ausentes:', { email, password, role });
      return res.status(400).json({ message: 'Email, senha e função são obrigatórios' });
    }

    console.log('Buscando usuário no banco de dados...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado para email:', email);
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    console.log('Verificando função do usuário...');
    if (user.role !== role) {
      console.log('Role não corresponde:', { expected: role, found: user.role });
      return res.status(400).json({ message: 'Função inválida para este usuário' });
    }

    console.log('Comparando senha...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Senha inválida para o usuário:', email);
      return res.status(400).json({ message: 'Senha inválida' });
    }

    console.log('Verificando JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está definido no ambiente.');
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    console.log('Gerando token JWT...');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('Token gerado:', token);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Erro no endpoint /login:', error.message, error.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}));

module.exports = router;

process.env.JWT_SECRET = 'seu_segredo_super_secreto';

