const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
    const token = jwt.sign({ id: user._id }, '7e6ff62ecda93407fc58ca8c4c25b136f0842052c54ebfbe005d3533898af8ab563a0d46f6087b4ff1f0d6ad560410cd4ec76e96ecb957d2c7f6717213311223759f1fed04bd2616a7df7de1a8279e7fd051864674bfae20d959cf3fe09e7114704e72b94bc6708d96a1596a90c1d0b25afc97daac80f9d12b5e38c53d9938c209def8d552d7d68bdc18d384cea72cc743cc33c18e1ea5d4013ed5d471dd1fd40bc615f0f0e837b5f2c3f41e6ce14bcaf0077d8a4c95063869474169cab213b69a742691918728d615baf6191f8f1d9f755a48fecb779e6be5af403415c8392f4978aae24694f9bbb889484bace1f52649e355528b65677a08d4986ff6a177a3', {
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