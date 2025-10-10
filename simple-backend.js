const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando' });
});

// Rota de login (mock)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock de login - aceita qualquer email/senha
  if (email && password) {
    const mockToken = 'mock_jwt_token_' + Date.now();
    
    res.json({
      success: true,
      message: 'Login bem-sucedido',
      token: mockToken,
      user: {
        id: '68dc9b40598466411a0bd253',
        email: email,
        name: 'Usuário Mock'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }
});

// Todas as rotas que o frontend precisa
app.get('/api/addresses', (req, res) => {
  res.json({
    success: true,
    addresses: [],
    message: 'Endereços carregados com sucesso'
  });
});

app.get('/api/products', (req, res) => {
  // Produtos mock para teste
  const mockProducts = [
    {
      _id: '1',
      name: 'Pizza Margherita',
      price: 25.90,
      category: 'Alimento',
      icon: '🍕',
      description: 'Molho de tomate, mussarela e manjericão'
    },
    {
      _id: '2',
      name: 'Hambúrguer Clássico',
      price: 18.50,
      category: 'Alimento',
      icon: '🍔',
      description: 'Hambúrguer com queijo, alface e tomate'
    },
    {
      _id: '3',
      name: 'Refrigerante',
      price: 4.50,
      category: 'Bebida',
      icon: '🥤',
      description: 'Refrigerante gelado'
    },
    {
      _id: '4',
      name: 'Batata Frita',
      price: 8.90,
      category: 'Alimento',
      icon: '🍟',
      description: 'Batata frita crocante'
    }
  ];
  
  res.json({
    success: true,
    data: { products: mockProducts },
    message: 'Produtos carregados com sucesso'
  });
});

app.get('/api/deliveries', (req, res) => {
  res.json({
    success: true,
    data: { deliveries: [] },
    message: 'Entregas carregadas com sucesso'
  });
});

app.get('/api/deliveries/history', (req, res) => {
  res.json({
    success: true,
    data: {
      deliveries: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    },
    message: 'Histórico carregado com sucesso'
  });
});

app.get('/api/deliveries/active-deliveries', (req, res) => {
  res.json({
    success: true,
    data: { deliveries: [] },
    message: 'Entregas ativas carregadas com sucesso'
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalDeliveries: 0,
      pendingDeliveries: 0,
      completedDeliveries: 0,
      totalRevenue: 0
    },
    message: 'Estatísticas carregadas com sucesso'
  });
});

// Rotas POST com merchantId automático
app.post('/api/products', (req, res) => {
  const productData = {
    ...req.body,
    merchantId: '68dc9b40598466411a0bd253',
    _id: 'mock_' + Date.now()
  };
  
  res.json({
    success: true,
    data: productData,
    message: 'Produto criado com sucesso'
  });
});

app.post('/api/addresses', (req, res) => {
  const addressData = {
    ...req.body,
    merchantId: '68dc9b40598466411a0bd253',
    _id: 'mock_' + Date.now()
  };
  
  res.json({
    success: true,
    data: addressData,
    message: 'Endereço criado com sucesso'
  });
});

app.post('/api/deliveries', (req, res) => {
  const deliveryData = {
    ...req.body,
    merchantId: '68dc9b40598466411a0bd253',
    _id: 'mock_' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: deliveryData,
    message: 'Entrega criada com sucesso'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend SIMPLES rodando na porta ${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Todas as rotas implementadas!`);
});
