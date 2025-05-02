const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nahora';

console.log('Tentando conectar ao MongoDB com URI:', MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 30000,
})
  .then(() => console.log('Conectado ao MongoDB com sucesso'))
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders')); // Adicione esta linha

app.listen(5000, () => {
  console.log('Servidor rodando na porta 5000');
});