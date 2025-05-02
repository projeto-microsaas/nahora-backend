const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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

module.exports = router;