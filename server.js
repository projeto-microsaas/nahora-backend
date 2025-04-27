const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const deliveryRoutes = require('./routes/deliveries');
const orderRoutes = require('./routes/orders');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.set('strictQuery', true);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend está funcionando' });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ message: 'Erro no servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));