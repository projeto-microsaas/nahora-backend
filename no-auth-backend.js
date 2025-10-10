const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
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

// Middleware de autenticação opcional (permite acesso sem token)
const optionalAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, '7e6ff62ecda93407fc58ca8c4c25b136f0842052c54ebfbe005d3533898af8ab563a0d46f6087b4ff1f0d6ad560410cd4ec76e96ecb957d2c7f6717213311223759f1fed04bd2616a7df7de1a8279e7fd051864674bfae20d959cf3fe09e7114704e72b94bc6708d96a1596a90c1d0b25afc97daac80f9d12b5e38c53d9938c209def8d552d7d68bdc18d384cea72cc743cc33c18e1ea5d4013ed5d471dd1fd40bc615f0f0e837b5f2c3f41e6ce14bcaf0077d8a4c95063869474169cab213b69a742691918728d615baf6191f8f1d9f755a48fecb779e6be5af403415c8392f4978aae24694f9bbb889484bace1f52649e355528b65677a08d4986ff6a177a3');
      req.user = { id: decoded.id };
      console.log('✅ Token válido para usuário:', decoded.id);
    } catch (error) {
      console.log('⚠️ Token inválido, continuando sem autenticação');
    }
  } else {
    console.log('ℹ️ Nenhum token fornecido, continuando sem autenticação');
  }
  next();
};

// ===== ROTAS SEM AUTENTICAÇÃO =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    auth: 'DISABLED'
  });
});

// Login com JWT para frontend web
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body);
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar senha com bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id }, 
      '7e6ff62ecda93407fc58ca8c4c25b136f0842052c54ebfbe005d3533898af8ab563a0d46f6087b4ff1f0d6ad560410cd4ec76e96ecb957d2c7f6717213311223759f1fed04bd2616a7df7de1a8279e7fd051864674bfae20d959cf3fe09e7114704e72b94bc6708d96a1596a90c1d0b25afc97daac80f9d12b5e38c53d9938c209def8d552d7d68bdc18d384cea72cc743cc33c18e1ea5d4013ed5d471dd1fd40bc615f0f0e837b5f2c3f41e6ce14bcaf0077d8a4c95063869474169cab213b69a742691918728d615baf6191f8f1d9f755a48fecb779e6be5af403415c8392f4978aae24694f9bbb889484bace1f52649e355528b65677a08d4986ff6a177a3',
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

// Produtos (autenticação opcional)
app.get('/api/products', optionalAuth, async (req, res) => {
  try {
    console.log('📦 Buscando produtos...');
    const products = await Product.find({});
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

// Criar produto (autenticação opcional)
app.post('/api/products', optionalAuth, async (req, res) => {
  try {
    console.log('📦 Criando produto:', req.body);
    const product = new Product(req.body);
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

// Atualizar produto (autenticação opcional)
app.put('/api/products/:id', optionalAuth, async (req, res) => {
  try {
    console.log('📦 Atualizando produto:', req.params.id, req.body);
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Produto não encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: product,
      message: 'Produto atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar produto',
      error: error.message
    });
  }
});

// Deletar produto (autenticação opcional)
app.delete('/api/products/:id', optionalAuth, async (req, res) => {
  try {
    console.log('📦 Deletando produto:', req.params.id);
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Produto não encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Produto deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao deletar produto',
      error: error.message
    });
  }
});

// Entregas (autenticação opcional)
app.get('/api/deliveries', optionalAuth, async (req, res) => {
  try {
    console.log('🚚 Buscando entregas...');
    const deliveries = await Delivery.find({});
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

// Deliveries History (autenticação opcional) - DEVE VIR ANTES de /api/deliveries/:id
app.get('/api/deliveries/history', optionalAuth, async (req, res) => {
  try {
    console.log('📋 Buscando histórico de entregas...');
    console.log('🔍 Query params:', req.query);
    console.log('🔗 Estado da conexão MongoDB:', mongoose.connection.readyState);
    
    const { search = '', page = 1, limit = 10, status = 'all' } = req.query;
    
    // Construir filtro
    const filter = {};
    if (search) {
      filter.$or = [
        { customer: { $regex: search, $options: 'i' } },
        { 'packageDetails.name': { $regex: search, $options: 'i' } },
        { packageDescription: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      filter.status = status;
    }
    
    console.log('🔍 Filtro aplicado:', filter);
    
    // Verificar se a coleção existe
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Coleções disponíveis:', collections.map(c => c.name));
    
    // Buscar entregas com paginação (sem populate para evitar erros)
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const deliveries = await Delivery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Usar lean() para melhor performance
    
    const total = await Delivery.countDocuments(filter);
    
    console.log(`✅ Encontradas ${deliveries.length} entregas de ${total} total`);
    
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
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de entregas:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro ao carregar histórico de entregas',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Buscar entrega por ID (autenticação opcional)
app.get('/api/deliveries/:id', optionalAuth, async (req, res) => {
  try {
    console.log('🚚 Buscando entrega por ID:', req.params.id);
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ 
        success: false,
        message: 'Entrega não encontrada' 
      });
    }
    
    res.json({
      success: true,
      data: delivery,
      message: 'Entrega encontrada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar entrega:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao carregar entrega' 
    });
  }
});

// Criar entrega (autenticação opcional)
app.post('/api/deliveries', optionalAuth, async (req, res) => {
  try {
    console.log('🚚 Criando entrega:', JSON.stringify(req.body, null, 2));
    
    // Validações básicas
    const { customer, phone, address, packageType, totalPrice, estimatedArrival } = req.body;
    
    if (!customer || !phone || !address || !packageType || !totalPrice || !estimatedArrival) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: customer, phone, address, packageType, totalPrice, estimatedArrival' 
      });
    }
    
    // Adicionar merchantId se o usuário estiver autenticado
    const deliveryData = { ...req.body };
    if (req.user?.id) {
      deliveryData.merchantId = req.user.id;
    } else {
      // Se não autenticado, usar um merchantId padrão ou gerar um
      deliveryData.merchantId = new mongoose.Types.ObjectId();
    }
    
    const delivery = new Delivery(deliveryData);
    const savedDelivery = await delivery.save();
    
    console.log('✅ Entrega criada com sucesso:', savedDelivery._id);
    
    res.status(201).json({
      success: true,
      delivery: savedDelivery,
      message: 'Entrega criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar entrega:', error);
    console.error('❌ Detalhes do erro:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({ 
      message: 'Erro ao criar entrega',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// Stats (autenticação opcional)
app.get('/api/stats', optionalAuth, async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas...');
    const totalDeliveries = await Delivery.countDocuments();
    const pendingDeliveries = await Delivery.countDocuments({ status: 'pending' });
    const totalProducts = await Product.countDocuments();
    
    res.json({
      totalDeliveries,
      pendingDeliveries,
      totalProducts,
      totalRevenue: 0,
      averageTime: 0,
      dailyDeliveries: {}
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao carregar estatísticas' });
  }
});

// Addresses (autenticação opcional)
app.get('/api/addresses', optionalAuth, async (req, res) => {
  try {
    console.log('📍 Buscando endereços...');
    const userId = req.user?.id;
    
    if (!userId) {
      return res.json({ addresses: [] });
    }
    
    const addresses = await Address.find({ merchantId: userId })
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({ addresses });
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    res.status(500).json({ message: 'Erro ao buscar endereços' });
  }
});

// Endpoint específico para mobile (sem autenticação)
app.get('/api/addresses/mobile', optionalAuth, async (req, res) => {
  try {
    console.log('📍 Buscando endereços para mobile...');
    
    // Para mobile, retornar endereços sem autenticação obrigatória
    const addresses = await Address.find({})
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({ 
      success: true,
      data: { addresses },
      message: 'Endereços carregados com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar endereços para mobile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar endereços',
      error: error.message
    });
  }
});

app.post('/api/addresses', optionalAuth, async (req, res) => {
  try {
    console.log('📍 Criando endereço...');
    const userId = req.user?.id;
    const { type, street, number, neighborhood, city, state, zipCode, complement, isDefault } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Validações básicas
    if (!type || !street || !number || !neighborhood || !city || !state) {
      return res.status(400).json({ message: 'Tipo, rua, número, bairro, cidade e estado são obrigatórios' });
    }

    // Se for definir como padrão, remover padrão anterior do mesmo tipo
    if (isDefault) {
      await Address.updateMany(
        { merchantId: userId, type, isDefault: true },
        { isDefault: false }
      );
    }

    const newAddress = new Address({
      type,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      complement,
      isDefault: isDefault || false,
      merchantId: userId
    });

    const savedAddress = await newAddress.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    console.error('❌ Erro ao criar endereço:', error);
    res.status(500).json({ message: 'Erro ao criar endereço' });
  }
});

app.put('/api/addresses/:id', optionalAuth, async (req, res) => {
  try {
    console.log('📍 Atualizando endereço...');
    const userId = req.user?.id;
    const { type, street, number, neighborhood, city, state, zipCode, complement, isDefault } = req.body;
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Verificar se o endereço pertence ao comerciante
    const existingAddress = await Address.findOne({ 
      _id: addressId, 
      merchantId: userId 
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    // Se for definir como padrão, remover padrão anterior do mesmo tipo
    if (isDefault && !existingAddress.isDefault) {
      await Address.updateMany(
        { merchantId: userId, type: type || existingAddress.type, isDefault: true },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        type: type || existingAddress.type,
        street: street || existingAddress.street,
        number: number || existingAddress.number,
        neighborhood: neighborhood || existingAddress.neighborhood,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        zipCode: zipCode !== undefined ? zipCode : existingAddress.zipCode,
        complement: complement !== undefined ? complement : existingAddress.complement,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      },
      { new: true }
    );

    res.json(updatedAddress);
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
    res.status(500).json({ message: 'Erro ao atualizar endereço' });
  }
});

app.delete('/api/addresses/:id', optionalAuth, async (req, res) => {
  try {
    console.log('📍 Deletando endereço...');
    const userId = req.user?.id;
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Verificar se o endereço pertence ao comerciante
    const address = await Address.findOne({ 
      _id: addressId, 
      merchantId: userId 
    });

    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    await Address.findByIdAndDelete(addressId);
    res.json({ message: 'Endereço removido com sucesso' });
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
  console.log(`🌐 Web Frontend: http://localhost:3000`);
  console.log(`📱 App Mobile: Metro bundler na porta 8081`);
  console.log(`🔧 API: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔓 AUTENTICAÇÃO: OPCIONAL (Web com token, Mobile sem token)`);
});

module.exports = { app, server };
