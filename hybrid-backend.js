const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.io
const io = new Server(server, {
  cors: {
    origin: true, // Permitir todas as origens
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
});

// JWT_SECRET - usar o mesmo em todo o backend
const JWT_SECRET = process.env.JWT_SECRET || '7e6ff62ecda93407fc58ca8c4c25b136f0842052c54ebfbe005d3533898af8ab563a0d46f6087b4ff1f0d6ad560410cd4ec76e96ecb957d2c7f6717213311223759f1fed04bd2616a7df7de1a8279e7fd051864674bfae20d959cf3fe09e7114704e72b94bc6708d96a1596a90c1d0b25afc97daac80f9d12b5e38c53d9938c209def8d552d7d68bdc18d384cea72cc743cc33c18e1ea5d4013ed5d471dd1fd40bc615f0f0e837b5f2c3f41e6ce14bcaf0077d8a4c95063869474169cab213b69a742691918728d615baf6191f8f1d9f755a48fecb779e6be5af403415c8392f4978aae24694f9bbb889484bace1f52649e355528b65677a08d4986ff6a177a3';
console.log('🔑 JWT_SECRET carregado:', JWT_SECRET ? 'SIM' : 'NÃO');

// Middleware CORS - Permitir todas as origens
app.use(cors({
  origin: true, // Permitir todas as origens
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());

// Middleware de depuração
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Adicionar io ao req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Conectar ao MongoDB
const mongoUri = 'mongodb://127.0.0.1:27017/nahora';
console.log('🔗 Tentando conectar ao MongoDB:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Conectado ao MongoDB com sucesso!');
}).catch(err => {
  console.error('❌ Erro ao conectar ao MongoDB:', err.message);
});

mongoose.set('strictQuery', true);

// Importar modelos
const User = require('./models/User');
const Delivery = require('./models/Delivery');
const Product = require('./models/Product');
const Address = require('./models/Address');

// ===== MIDDLEWARE DE AUTENTICAÇÃO HÍBRIDO =====
const authenticateToken = (req, res, next) => {
  // Verificar se é uma requisição do app mobile (sem autenticação)
  const userAgent = req.headers['user-agent'] || '';
  const isMobileApp = userAgent.includes('okhttp') || userAgent.includes('ReactNative');
  
  // Se for app mobile, pular autenticação
  if (isMobileApp) {
    console.log('📱 Requisição do app mobile - pulando autenticação');
    req.user = { id: '68dc9b40598466411a0bd253' }; // ID fixo para desenvolvimento
    return next();
  }
  
  // Para web frontend, usar autenticação JWT
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("🔐 Middleware authenticateToken executado para:", req.url);
  console.log("🔑 JWT_SECRET disponível:", JWT_SECRET ? 'SIM' : 'NÃO');

  if (!token) {
    console.log("Nenhum token fornecido.");
    return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
  }

  try {
    console.log("Token recebido no middleware auth:", token);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token decodificado com sucesso:", decoded);

    if (!decoded.id || decoded.id === "stats" || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      throw new Error("ID de usuário inválido no token: " + JSON.stringify(decoded));
    }
    req.user = { id: decoded.id };
    console.log("req.user definido como:", req.user);
    next();
  } catch (error) {
    console.error("Erro ao verificar token:", error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token inválido ou expirado", error: error.message });
    }
    return res.status(500).json({ message: "Erro interno ao verificar token", error: error.message });
  }
};

// ===== ROTAS =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    auth: 'HYBRID (Web: JWT, App: None)'
  });
});


// Login (com JWT para web)
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body);
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      message: 'Login bem-sucedido',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Produtos (com autenticação híbrida)
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    console.log('📦 Buscando produtos para merchantId:', req.user.id);
    const products = await Product.find({ merchantId: req.user.id });
    console.log('📦 Produtos encontrados:', products.length);
    res.json({
      success: true,
      data: { products },
      message: 'Produtos carregados com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao carregar produtos' });
  }
});

// Criar produto (com autenticação híbrida)
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    console.log('📦 Criando produto:', req.body);
    
    // Adicionar merchantId automaticamente
    const productData = {
      ...req.body,
      merchantId: req.user.id // Usar o ID do usuário autenticado
    };
    
    const product = new Product(productData);
    await product.save();
    res.json({
      success: true,
      data: product,
      message: 'Produto criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
});

// Entregas (com autenticação híbrida)
app.get('/api/deliveries', authenticateToken, async (req, res) => {
  try {
    console.log('🚚 Buscando entregas para merchantId:', req.user.id);
    const deliveries = await Delivery.find({ merchantId: req.user.id });
    console.log('🚚 Entregas encontradas:', deliveries.length);
    res.json({
      success: true,
      data: { deliveries },
      message: 'Entregas carregadas com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar entregas:', error);
    res.status(500).json({ message: 'Erro ao carregar entregas' });
  }
});

// Criar entrega (com autenticação híbrida)
app.post('/api/deliveries', authenticateToken, async (req, res) => {
  try {
    console.log('🚚 Criando entrega:', req.body);
    
    // Adicionar merchantId automaticamente para app mobile
    const deliveryData = {
      ...req.body,
      merchantId: req.user.id // Usar o ID do usuário autenticado
    };
    
    const delivery = new Delivery(deliveryData);
    await delivery.save();
    res.json({
      success: true,
      data: delivery,
      message: 'Entrega criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar entrega:', error);
    res.status(500).json({ message: 'Erro ao criar entrega' });
  }
});

// Histórico de entregas (com autenticação híbrida)
app.get('/api/deliveries/history', authenticateToken, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, status = 'all' } = req.query;
    console.log('📋 Buscando histórico de entregas:', { search, page, limit, status });
    
    // Construir filtro
    const filter = { merchantId: req.user.id };
    if (search) {
      filter.$or = [
        { customer: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { packageDescription: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Buscar entregas com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const deliveries = await Delivery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Delivery.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        deliveries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Histórico carregado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao carregar histórico' });
  }
});

// Stats (com autenticação híbrida)
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas para merchantId:', req.user.id);
    const totalDeliveries = await Delivery.countDocuments({ merchantId: req.user.id });
    const pendingDeliveries = await Delivery.countDocuments({ merchantId: req.user.id, status: 'pending' });
    const completedDeliveries = await Delivery.countDocuments({ merchantId: req.user.id, status: 'completed' });
    const totalProducts = await Product.countDocuments({ merchantId: req.user.id });
    
    res.json({
      success: true,
      data: {
        totalDeliveries,
        pendingDeliveries,
        completedDeliveries,
        totalProducts,
        totalRevenue: 0,
        averageTime: 0,
        dailyDeliveries: {}
      },
      message: 'Estatísticas carregadas com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao carregar estatísticas' });
  }
});

// Buscar entrega específica por ID (com autenticação híbrida) - DEVE VIR POR ÚLTIMO
app.get('/api/deliveries/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🚚 Buscando entrega por ID:', req.params.id);
    
    // Verificar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de entrega inválido' });
    }
    
    const delivery = await Delivery.findOne({ 
      _id: req.params.id, 
      merchantId: req.user.id 
    });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }
    
    console.log('🚚 Entrega encontrada:', delivery._id);
    res.json({
      success: true,
      data: delivery,
      message: 'Entrega encontrada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar entrega:', error);
    res.status(500).json({ message: 'Erro ao buscar entrega' });
  }
});

// ===== ROTAS DE ENDEREÇOS =====
// Buscar endereços (com autenticação híbrida)
app.get('/api/addresses', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Buscando endereços...');
    const addresses = await Address.find({});
    res.json({
      success: true,
      addresses,
      message: 'Endereços carregados com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    res.status(500).json({ message: 'Erro ao carregar endereços' });
  }
});

// Rota de endereços SEM autenticação para o app mobile
app.get('/api/addresses/mobile', async (req, res) => {
  try {
    console.log('📍 Buscando endereços (mobile)...');
    const addresses = await Address.find({});
    res.json({
      success: true,
      data: { addresses },
      message: 'Endereços carregados com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar endereços (mobile):', error);
    res.status(500).json({ message: 'Erro ao carregar endereços' });
  }
});

// Criar endereço SEM autenticação para o app mobile
app.post('/api/addresses/mobile', async (req, res) => {
  try {
    console.log('📍 Criando endereço (mobile):', req.body);
    
    const addressData = {
      ...req.body,
      merchantId: '68dc9b40598466411a0bd253' // ID fixo para desenvolvimento
    };
    
    const address = new Address(addressData);
    await address.save();
    
    res.json({
      success: true,
      data: address,
      message: 'Endereço criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar endereço (mobile):', error);
    res.status(500).json({ message: 'Erro ao criar endereço' });
  }
});

// Criar endereço (com autenticação híbrida)
app.post('/api/addresses', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Criando endereço:', req.body);
    
    // Adicionar merchantId automaticamente
    const addressData = {
      ...req.body,
      merchantId: req.user.id // Usar o ID do usuário autenticado
    };
    
    const address = new Address(addressData);
    await address.save();
    res.json({
      success: true,
      data: address,
      message: 'Endereço criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar endereço:', error);
    res.status(500).json({ message: 'Erro ao criar endereço' });
  }
});

// Atualizar endereço (com autenticação híbrida)
app.put('/api/addresses/:id', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Atualizando endereço:', req.params.id, req.body);
    const address = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }
    res.json({
      success: true,
      data: address,
      message: 'Endereço atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
    res.status(500).json({ message: 'Erro ao atualizar endereço' });
  }
});

// Deletar endereço (com autenticação híbrida)
app.delete('/api/addresses/:id', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Deletando endereço:', req.params.id);
    const address = await Address.findByIdAndDelete(req.params.id);
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }
    res.json({
      success: true,
      message: 'Endereço deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar endereço:', error);
    res.status(500).json({ message: 'Erro ao deletar endereço' });
  }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Usuário conectado:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 Usuário ${userId} entrou na sala`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Usuário desconectado:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend HÍBRIDO rodando na porta ${PORT}`);
  console.log(`🌐 Web Frontend: http://localhost:3000 (COM AUTENTICAÇÃO JWT)`);
  console.log(`📱 App Mobile: Metro bundler na porta 8081 (SEM AUTENTICAÇÃO)`);
  console.log(`🔧 API: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 AUTENTICAÇÃO: HÍBRIDA (Web: JWT, App: None)`);
});

module.exports = { app, server };
