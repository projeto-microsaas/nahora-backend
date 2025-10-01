const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Endpoint de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

router.post('/login', async (req, res) => {
  console.log('Requisição recebida em /api/auth/login:', req.body);
  const { email, password } = req.body;

  try {
    console.log('Buscando usuário:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    console.log('Usuário encontrado, verificando senha...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Senha incorreta para usuário:', email);
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    console.log('Senha correta, gerando token...');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'seu_segredo_super_secreto_aqui_123456789', {
      expiresIn: '1h',
    });

    console.log('Token gerado com sucesso para usuário:', user.email);
    console.log('Enviando resposta de sucesso...');
    
    res.status(200).json({ message: 'Login bem-sucedido', token, user: { email: user.email } });
    console.log('Resposta enviada com sucesso');
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Usuário criado com sucesso', user: { email } });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
});

module.exports = router;