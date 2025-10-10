const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || '7e6ff62ecda93407fc58ca8c4c25b136f0842052c54ebfbe005d3533898af8ab563a0d46f6087b4ff1f0d6ad560410cd4ec76e96ecb957d2c7f6717213311223759f1fed04bd2616a7df7de1a8279e7fd051864674bfae20d959cf3fe09e7114704e72b94bc6708d96a1596a90c1d0b25afc97daac80f9d12b5e38c53d9938c209def8d552d7d68bdc18d384cea72cc743cc33c18e1ea5d4013ed5d471dd1fd40bc615f0f0e837b5f2c3f41e6ce14bcaf0077d8a4c95063869474169cab213b69a742691918728d615baf6191f8f1d9f755a48fecb779e6be5af403415c8392f4978aae24694f9bbb889484bace1f52649e355528b65677a08d4986ff6a177a3';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8081', 'http://127.0.0.1:8081', 'http://10.0.2.2:8081'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token ausente' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token inválido' });
  }
};

// Dados em memória para desenvolvimento
let users = [
  {
    id: '68dc9b40598466411a0bd253',
    name: 'Thais',
    email: 'thais@gmail.com',
    password: '123456',
    role: 'merchant'
  }
];

let products = [
  {
    _id: '1',
    name: 'Pizza Margherita',
    description: 'Pizza com molho de tomate, mussarela e manjericão',
    price: 25.90,
    category: 'Pizzas',
    available: true
  },
  {
    _id: '2',
    name: 'Hambúrguer Clássico',
    description: 'Hambúrguer com carne, queijo, alface e tomate',
    price: 18.50,
    category: 'Lanches',
    available: true
  }
];

let deliveries = [
  {
    _id: '1',
    customer: 'João Silva',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123',
    status: 'pending',
    totalPrice: 48.90,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Pizza Margherita', quantity: 1, price: 25.90 },
      { name: 'Hambúrguer Clássico', quantity: 1, price: 18.50 }
    ]
  }
];

let orders = [
  {
    _id: '1',
    customer: { name: 'Maria Santos', phone: '(11) 88888-8888' },
    deliveryAddress: 'Av. Paulista, 456',
    status: 'pending',
    total: 35.40,
    createdAt: new Date().toISOString(),
    products: [
      { name: 'Pizza Margherita', quantity: 1, price: 25.90 },
      { name: 'Coca-Cola 350ml', quantity: 2, price: 4.50 }
    ]
  }
];

// Rotas de autenticação
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } else {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role: 'merchant'
  };
  users.push(newUser);
  res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Rotas de produtos
app.get('/api/products', authenticateToken, (req, res) => {
  res.json(products);
});

app.post('/api/products', authenticateToken, (req, res) => {
  const newProduct = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);
  res.json(newProduct);
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const index = products.findIndex(p => p._id === req.params.id);
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
  } else {
    res.status(404).json({ message: 'Produto não encontrado' });
  }
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const index = products.findIndex(p => p._id === req.params.id);
  if (index !== -1) {
    products.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Produto não encontrado' });
  }
});

// Rotas de entregas
app.get('/api/deliveries', authenticateToken, (req, res) => {
  res.json(deliveries);
});

app.post('/api/deliveries', authenticateToken, (req, res) => {
  const newDelivery = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  deliveries.push(newDelivery);
  res.json(newDelivery);
});

app.put('/api/deliveries/:id/status', authenticateToken, (req, res) => {
  const delivery = deliveries.find(d => d._id === req.params.id);
  if (delivery) {
    delivery.status = req.body.status;
    res.json(delivery);
  } else {
    res.status(404).json({ message: 'Entrega não encontrada' });
  }
});

// Rotas de pedidos
app.get('/api/orders', authenticateToken, (req, res) => {
  res.json(orders);
});

app.post('/api/orders', authenticateToken, (req, res) => {
  const newOrder = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  res.json(newOrder);
});

// Rotas de estatísticas
app.get('/api/stats', authenticateToken, (req, res) => {
  res.json({
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📡 Teste: http://localhost:${PORT}/api/test`);
});
