require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const statsRoutes = require('./routes/statsRoutes');
const productRoutes = require('./routes/productRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const addressRoutes = require('./routes/addressRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Middleware CORS
app.use(cors({
  origin: [
    'http://localhost:3000',      // Web frontend
    'http://127.0.0.1:3000',      // Web frontend (alternativo)
    'http://localhost:8081',      // React Native Metro
    'http://127.0.0.1:8081',      // React Native Metro (alternativo)
    'http://10.0.2.2:8081',       // Android Emulator
    'http://10.0.0.46:8081',      // IP real para Android
    'http://10.0.0.46:5000'       // IP real para API
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());

// Middleware de depuração simplificado
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Adicionar io ao req para uso nas rotas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  console.log('Middleware authenticateToken executado para:', req.url);
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log('Token ausente para:', req.url);
    return res.status(401).json({ message: 'Token ausente' });
  }

  try {
    const secret = process.env.JWT_SECRET || '7e6ff62ecda93407fc58ca8c4c25b136f0842052c54ebfbe005d3533898af8ab563a0d46f6087b4ff1f0d6ad560410cd4ec76e96ecb957d2c7f6717213311223759f1fed04bd2616a7df7de1a8279e7fd051864674bfae20d959cf3fe09e7114704e72b94bc6708d96a1596a90c1d0b25afc97daac80f9d12b5e38c53d9938c209def8d552d7d68bdc18d384cea72cc743cc33c18e1ea5d4013ed5d471dd1fd40bc615f0f0e837b5f2c3f41e6ce14bcaf0077d8a4c95063869474169cab213b69a742691918728d615baf6191f8f1d9f755a48fecb779e6be5af403415c8392f4978aae24694f9bbb889484bace1f52649e355528b65677a08d4986ff6a177a3';
    if (!secret) {
      console.log('JWT_SECRET ausente');
      return res.status(500).json({ message: 'JWT_SECRET ausente' });
    }
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };
    console.log('Token válido para usuário:', decoded.id);
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    res.status(403).json({ message: 'Token inválido' });
  }
};

// Conectar ao MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nahora';
console.log('Tentando conectar ao MongoDB:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Conectado ao MongoDB com sucesso!');
}).catch(err => {
  console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  console.log('💡 Dica: Instale o MongoDB ou use MongoDB Atlas');
});

mongoose.set('strictQuery', true);

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', authenticateToken, deliveryRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/addresses', authenticateToken, addressRoutes);
app.use('/api/system', systemRoutes);

// ==========================
// Rota histórica de entregas
// ==========================
app.get('/api/deliveries/history', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const query = { merchantId: req.user.id, status: { $in: ['completed','cancelled'] } };

    if (search) {
      const orConditions = [
        { customer: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: search });
      }
      query.$or = orConditions;
    }

    const deliveries = await mongoose.model('Delivery').find(query)
      .limit(Number(limit))
      .skip((Number(page)-1)*Number(limit))
      .sort({ completedAt: -1 });

    res.json({ deliveries });
  } catch (error) {
    console.error('Erro ao buscar histórico de entregas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar histórico', error: error.message });
  }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// ==========================
// WebSocket
// ==========================
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Usuário ${userId} entrou na sala`);
  });
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = { app };
