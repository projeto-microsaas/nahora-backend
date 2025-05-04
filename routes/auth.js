const express = require('express');
     const router = express.Router();
     const jwt = require('jsonwebtoken');
     const bcrypt = require('bcryptjs');
     const User = require('../models/User');

     const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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
       try {
         const { email, password, role } = req.body;
         console.log('Dados recebidos no login:', { email, password, role });

         const user = await User.findOne({ email, role });
         console.log('Usuário encontrado:', user);

         if (!user || !(await bcrypt.compare(password, user.password))) {
           return res.status(401).json({ message: 'Credenciais inválidas' });
         }

         const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
         console.log('Login bem-sucedido, token gerado:', token);
         res.json({ token });
       } catch (err) {
         console.error('Erro ao fazer login:', err);
         res.status(500).json({ message: 'Erro no servidor' });
       }
     });

     router.get('/user', authenticateToken, async (req, res) => {
       try {
         const user = await User.findById(req.user.id).select('-password');
         console.log('Dados do usuário retornados:', user);
         if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
         res.json(user);
       } catch (err) {
         console.error('Erro ao buscar usuário:', err);
         res.status(500).json({ message: 'Erro no servidor' });
       }
     });

     router.put('/user', authenticateToken, async (req, res) => {
       try {
         const { name, email } = req.body;
         const user = await User.findById(req.user.id);
         if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

         if (name) user.name = name;
         if (email) user.email = email;

         await user.save();
         res.json({ message: 'Usuário atualizado com sucesso', user: user.toJSON() });
       } catch (err) {
         console.error('Erro ao atualizar usuário:', err);
         res.status(500).json({ message: 'Erro no servidor' });
       }
     });

     module.exports = router;