require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const connectToMongoDB = async () => {
  console.log('Tentando conectar ao MongoDB com URI:', process.env.MONGO_URI || 'mongodb://mongodb:27017/nahora');
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/nahora', {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });
    console.log('Conectado ao MongoDB com sucesso');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    setTimeout(connectToMongoDB, 5000);
  }
};

connectToMongoDB();

console.log('Carregando authRoutes...');
app.use('/api/auth', authRoutes);
console.log('Carregando deliveryRoutes...');
app.use('/api', deliveryRoutes);
console.log('Carregando productRoutes...');
app.use('/api', productRoutes);
console.log('Carregando userRoutes...');
app.use('/api', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API do Javai Delivery rodando!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});