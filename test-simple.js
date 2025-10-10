const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check chamado');
  res.json({ status: 'OK', message: 'Backend funcionando' });
});

// Rota de login (para o web frontend)
app.post('/api/auth/login', (req, res) => {
  console.log('Login chamado:', req.body);
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

// Rota de verificação de token
app.get('/api/auth/verify', (req, res) => {
  console.log('Verificação de token chamada');
  res.json({
    success: true,
    user: {
      id: '68dc9b40598466411a0bd253',
      email: 'thais@gmail.com',
      name: 'Usuário Mock'
    }
  });
});

// Rota de produtos
app.get('/api/products', (req, res) => {
  console.log('Produtos chamado');
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
    }
  ];
  
  res.json({
    success: true,
    data: { products: mockProducts },
    message: 'Produtos carregados com sucesso'
  });
});

// Rota de entregas
app.get('/api/deliveries', (req, res) => {
  console.log('Entregas chamado');
  res.json({
    success: true,
    data: { deliveries: [] },
    message: 'Entregas carregadas com sucesso'
  });
});

// Rota de stats
app.get('/api/stats', (req, res) => {
  console.log('Stats chamado');
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

// Rota de histórico de entregas
app.get('/api/deliveries/history', (req, res) => {
  console.log('Histórico de entregas chamado');
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

// Rota de endereços
app.get('/api/addresses', (req, res) => {
  console.log('Endereços chamado');
  res.json({
    success: true,
    data: { addresses: [] },
    message: 'Endereços carregados com sucesso'
  });
});

// Rota POST para criar entregas
app.post('/api/deliveries', (req, res) => {
  console.log('Criar entrega chamado:', req.body);
  const deliveryData = {
    ...req.body,
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

// Rota POST para criar produtos
app.post('/api/products', (req, res) => {
  console.log('Criar produto chamado:', req.body);
  const productData = {
    ...req.body,
    _id: 'mock_' + Date.now()
  };
  
  res.json({
    success: true,
    data: productData,
    message: 'Produto criado com sucesso'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend TESTE rodando na porta ${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Produtos: http://localhost:${PORT}/api/products`);
});
