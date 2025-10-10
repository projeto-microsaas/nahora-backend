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

// Teste de endereços
app.get('/api/addresses', (req, res) => {
  res.json({
    success: true,
    addresses: [],
    message: 'Endereços carregados com sucesso'
  });
});

// Teste de produtos
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: { products: [] },
    message: 'Produtos carregados com sucesso'
  });
});

// Teste de entregas
app.get('/api/deliveries', (req, res) => {
  res.json({
    success: true,
    data: { deliveries: [] },
    message: 'Entregas carregadas com sucesso'
  });
});

// Teste de histórico
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

// Rota para entregas ativas (que o frontend está tentando acessar)
app.get('/api/deliveries/active-deliveries', (req, res) => {
  res.json({
    success: true,
    data: { deliveries: [] },
    message: 'Entregas ativas carregadas com sucesso'
  });
});

// Rota para estatísticas
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

// Rota para criar produtos (com merchantId automático)
app.post('/api/products', (req, res) => {
  const productData = {
    ...req.body,
    merchantId: '68dc9b40598466411a0bd253', // ID fixo para desenvolvimento
    _id: 'mock_' + Date.now()
  };
  
  res.json({
    success: true,
    data: productData,
    message: 'Produto criado com sucesso'
  });
});

// Rota para criar endereços (com merchantId automático)
app.post('/api/addresses', (req, res) => {
  const addressData = {
    ...req.body,
    merchantId: '68dc9b40598466411a0bd253', // ID fixo para desenvolvimento
    _id: 'mock_' + Date.now()
  };
  
  res.json({
    success: true,
    data: addressData,
    message: 'Endereço criado com sucesso'
  });
});

// Rota para criar entregas
app.post('/api/deliveries', (req, res) => {
  const deliveryData = {
    ...req.body,
    merchantId: '68dc9b40598466411a0bd253', // ID fixo para desenvolvimento
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
  console.log(`🚀 Backend de teste rodando na porta ${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
});
