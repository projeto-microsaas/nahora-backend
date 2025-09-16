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
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json());

// Adicionar io ao req para uso nas rotas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token ausente' });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'JWT_SECRET ausente' });
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    res.status(403).json({ message: 'Token inválido' });
  }
};

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/nahora', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

mongoose.set('strictQuery', true);

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', authenticateToken, deliveryRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

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
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = { app, io };
