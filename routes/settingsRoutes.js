const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const History = require('../models/History');
const bcrypt = require('bcryptjs');
const { io } = require('../server');

const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0, remainder;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const validateCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size += 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

// Rota para obter perfil do usuário
router.get('/me', async (req, res) => {
  try {
    console.log("Usuário autenticado em /me:", req.user);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    console.error("Erro ao carregar perfil em /me:", error);
    res.status(500).json({ message: 'Erro ao carregar perfil: ' + error.message });
  }
});

// Rota para atualizar perfil do usuário
router.put('/me', async (req, res) => {
  try {
    console.log("Dados recebidos para atualizar perfil em /me:", req.body);
    const { name, email, phone, cpf } = req.body;
    if (cpf && !validateCPF(cpf)) {
      return res.status(400).json({ message: 'CPF inválido' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, cpf },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    console.log("Usuário atualizado em /me:", user);
    await History.create({ userId: req.user.id, action: `Atualizou perfil: ${name}`, date: new Date() });
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Perfil atualizado com sucesso', user: user.toJSON() });
  } catch (error) {
    console.error("Erro ao atualizar perfil em /me:", error);
    res.status(500).json({ message: 'Erro ao atualizar perfil: ' + error.message });
  }
});

// Rota para atualizar senha
router.put('/security', async (req, res) => {
  try {
    const { current, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'As senhas não coincidem' });
    }
    if (!newPassword || !current) {
      return res.status(400).json({ message: 'Preencha todos os campos de senha' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    const isMatch = await user.comparePassword(current);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    await History.create({ userId: req.user.id, action: "Atualizou senha", date: new Date() });
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error("Erro ao atualizar senha em /security:", error);
    res.status(500).json({ message: 'Erro ao atualizar senha: ' + error.message });
  }
});

// Rota para obter dados da loja
router.get('/business', async (req, res) => {
  try {
    console.log("Usuário autenticado em /business:", req.user);
    let business = await Business.findOne({ userId: req.user.id });
    if (!business) {
      business = await Business.create({
        userId: req.user.id,
        name: "",
        type: "",
        cnpj: "",
        phone: "",
        address: ""
      });
    }
    res.json(business);
  } catch (error) {
    console.error("Erro ao carregar dados da loja em /business:", error);
    res.status(500).json({ message: 'Erro ao carregar dados da loja: ' + error.message });
  }
});

// Rota para atualizar dados da loja
router.put('/business', async (req, res) => {
  try {
    const { name, type, cnpj, phone, address } = req.body;
    if (cnpj && !validateCNPJ(cnpj)) {
      return res.status(400).json({ message: 'CNPJ inválido' });
    }
    let business = await Business.findOneAndUpdate(
      { userId: req.user.id },
      { name, type, cnpj, phone, address, userId: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );
    await History.create({ userId: req.user.id, action: `Atualizou loja: ${name}`, date: new Date() });
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Dados da loja salvos com sucesso', business });
  } catch (error) {
    console.error("Erro ao salvar dados da loja em /business:", error);
    res.status(500).json({ message: 'Erro ao salvar dados da loja: ' + error.message });
  }
});

// Rota para obter preferências de notificação
router.get('/notifications', async (req, res) => {
  try {
    console.log("Usuário autenticado em /notifications:", req.user);
    let notification = await Notification.findOne({ userId: req.user.id });
    if (!notification) {
      notification = await Notification.create({
        userId: req.user.id,
        emailNewDelivery: true,
        emailStatusChanges: true,
        emailDelivered: true,
        emailPayment: true,
        smsNewDelivery: false,
        smsStatusChanges: true,
        smsDelivered: true,
      });
    }
    res.json(notification);
  } catch (error) {
    console.error("Erro ao carregar notificações em /notifications:", error);
    res.status(500).json({ message: 'Erro ao carregar notificações: ' + error.message });
  }
});

// Rota para atualizar preferências de notificação
router.put('/notifications', async (req, res) => {
  try {
    const {
      emailNewDelivery, emailStatusChanges, emailDelivered, emailPayment,
      smsNewDelivery, smsStatusChanges, smsDelivered,
    } = req.body;
    let notification = await Notification.findOneAndUpdate(
      { userId: req.user.id },
      {
        emailNewDelivery, emailStatusChanges, emailDelivered, emailPayment,
        smsNewDelivery, smsStatusChanges, smsDelivered,
        userId: req.user.id
      },
      { new: true, upsert: true, runValidators: true }
    );
    await History.create({ userId: req.user.id, action: "Atualizou preferências de notificação", date: new Date() });
    if (io && (notification.emailStatusChanges || notification.smsStatusChanges)) {
      io.to(req.user.id).emit('notification', {
        message: 'Preferências de notificação atualizadas com sucesso!',
        type: notification.emailStatusChanges ? 'email' : 'sms'
      });
    }
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Preferências de notificação salvas com sucesso', notification });
  } catch (error) {
    console.error("Erro ao salvar notificações em /notifications:", error);
    res.status(500).json({ message: 'Erro ao salvar notificações: ' + error.message });
  }
});

// Rota para obter cartões
router.get('/payment/cards', async (req, res) => {
  try {
    console.log("Usuário autenticado em /payment/cards:", req.user);
    const user = await User.findById(req.user.id).select('cards');
    res.json(user.cards || []);
  } catch (error) {
    console.error("Erro ao carregar cartões em /payment/cards:", error);
    res.status(500).json({ message: 'Erro ao carregar cartões: ' + error.message });
  }
});

// Rota para adicionar/atualizar cartão
router.post('/payment/cards', async (req, res) => {
  try {
    console.log("Dados recebidos para adicionar cartão em /payment/cards:", req.body);
    const { number, expiry, cvv, cardLast4 } = req.body;
    if (!number || !expiry || !cvv || number.length !== 16 || cvv.length !== 3 || !/^\d{4}$/.test(cardLast4)) {
      return res.status(400).json({ message: 'Dados do cartão inválidos' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    if (!user.cards) user.cards = [];
    user.cards.push({ number, expiry, cvv, cardLast4 });
    await user.save();
    await History.create({ userId: req.user.id, action: `Adicionou cartão finalizado em ${cardLast4}`, date: new Date() });
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Cartão adicionado com sucesso', cards: user.cards });
  } catch (error) {
    console.error("Erro ao adicionar cartão em /payment/cards:", error);
    res.status(500).json({ message: 'Erro ao adicionar cartão: ' + error.message });
  }
});

// Rota para remover cartão
router.delete('/payment/cards/:cardLast4', async (req, res) => {
  try {
    const { cardLast4 } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    user.cards = user.cards.filter(card => card.cardLast4 !== cardLast4);
    await user.save();
    await History.create({ userId: req.user.id, action: `Removeu cartão finalizado em ${cardLast4}`, date: new Date() });
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Cartão removido com sucesso', cards: user.cards });
  } catch (error) {
    console.error("Erro ao remover cartão em /payment/cards/:cardLast4:", error);
    res.status(500).json({ message: 'Erro ao remover cartão: ' + error.message });
  }
});

// Rota simulada para pagamentos
router.put('/payment', async (req, res) => {
  try {
    console.log("Usuário autenticado em /payment:", req.user);
    if (!req.user || !req.user.id) {
      console.log("Erro: req.user ou req.user.id é undefined em /payment");
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    const { plan, cardLast4 } = req.body;
    console.log('Dados recebidos em /payment:', req.body);
    if (cardLast4 && (cardLast4.length !== 4 || isNaN(cardLast4))) {
      return res.status(400).json({ message: 'Digite 4 dígitos válidos para o cartão' });
    }
    const updatedPlan = plan || "Plano Básico";
    await History.create({ userId: req.user.id, action: `Atualizou pagamento: Plano ${updatedPlan}, Cartão ${cardLast4}`, date: new Date() });
    const notification = await Notification.findOne({ userId: req.user.id }).lean();
    if (io && notification?.emailPayment) {
      io.to(req.user.id).emit('notification', { message: `Pagamento atualizado: Plano ${updatedPlan}`, type: 'email' });
    }
    if (io && notification?.smsStatusChanges) {
      io.to(req.user.id).emit('notification', { message: `Pagamento atualizado: Plano ${updatedPlan}`, type: 'sms' });
    }
    if (io) io.to(req.user.id).emit('historyUpdate', await History.find({ userId: req.user.id }).sort({ date: -1 }));
    res.json({ message: 'Pagamento atualizado com sucesso! (Simulação)', plan: updatedPlan, cardLast4 });
  } catch (error) {
    console.error('Erro ao processar /payment:', error);
    res.status(500).json({ message: 'Erro ao atualizar pagamento: ' + error.message });
  }
});

// Rota para obter histórico
router.get('/history', async (req, res) => {
  try {
    console.log("Usuário autenticado em /history:", req.user);
    const history = await History.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    console.error("Erro ao carregar histórico em /history:", error);
    res.status(500).json({ message: 'Erro ao carregar histórico: ' + error.message });
  }
});

module.exports = router;