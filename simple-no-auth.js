const express = require('express');
const cors = require('cors');

const app = express();

// Middleware CORS
app.use(cors({
  origin: true,
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

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando sem autenticação',
    timestamp: new Date().toISOString()
  });
});

// Entregas sem autenticação - dados simulados
app.get('/api/deliveries', (req, res) => {
  console.log('🚚 Buscando entregas (sem autenticação)...');
  
  const mockDeliveries = [
    {
      _id: 'delivery-1',
      customer: 'Maria Silva',
      phone: '(11) 9999-1111',
      address: 'Rua das Flores, 123 - Centro',
      status: 'pending',
      totalPrice: 25.50,
      createdAt: new Date().toISOString(),
      items: ['Hambúrguer', 'Batata Frita', 'Refrigerante']
    },
    {
      _id: 'delivery-2',
      customer: 'João Santos',
      phone: '(11) 9999-2222',
      address: 'Av. Principal, 456 - Jardim',
      status: 'delivered',
      totalPrice: 35.00,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      items: ['Pizza', 'Coca-Cola']
    },
    {
      _id: 'delivery-3',
      customer: 'Ana Oliveira',
      phone: '(11) 9999-3333',
      address: 'Rua da Paz, 789 - Vila Nova',
      status: 'preparing',
      totalPrice: 18.90,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      items: ['Açaí', 'Granola']
    }
  ];

  res.json({
    success: true,
    data: { deliveries: mockDeliveries },
    message: 'Entregas carregadas com sucesso (sem autenticação)'
  });
});

// Estatísticas sem autenticação
app.get('/api/stats', (req, res) => {
  console.log('📊 Buscando estatísticas (sem autenticação)...');
  
  res.json({
    success: true,
    data: {
      totalDeliveries: 15,
      todayDeliveries: 3,
      totalRevenue: 450.50,
      averageTicket: 30.03
    },
    message: 'Estatísticas carregadas com sucesso (sem autenticação)'
  });
});

// Produtos sem autenticação
app.get('/api/products', (req, res) => {
  console.log('📦 Buscando produtos (sem autenticação)...');
  
  const mockProducts = [
    {
      _id: 'product-1',
      name: 'Hambúrguer Clássico',
      price: 15.90,
      category: 'Lanches',
      description: 'Hambúrguer com carne, alface, tomate e queijo'
    },
    {
      _id: 'product-2',
      name: 'Pizza Margherita',
      price: 25.00,
      category: 'Pizzas',
      description: 'Pizza com molho de tomate, mussarela e manjericão'
    }
  ];

  res.json({
    success: true,
    data: { products: mockProducts },
    message: 'Produtos carregados com sucesso (sem autenticação)'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend SIMPLES (sem autenticação) rodando na porta ${PORT}`);
  console.log(`🌐 Web Frontend: http://localhost:3000`);
  console.log(`📱 App Mobile: http://10.0.2.2:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔓 AUTENTICAÇÃO: DESABILITADA (Mobile sem token)`);
});

module.exports = app;
