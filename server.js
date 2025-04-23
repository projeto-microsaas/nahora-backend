const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Configurar o middleware CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Permitir origens do merchant e driver
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

app.use(express.json());

// Conexão com o MongoDB (autenticando no banco admin)
mongoose.connect('mongodb://admin:password@mongo:27017/nahora?authSource=admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Modelo de Usuário
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Modelo de Pedido
const OrderSchema = new mongoose.Schema({
  client: String,
  description: String,
  value: Number,
  status: { type: String, default: 'pending' },
});

const Order = mongoose.model('Order', OrderSchema);

// Middleware de Autenticação
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Rota de Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rotas de Pedidos
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { client, description, value } = req.body;
    const order = new Order({ client, description, value });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Inicializar Usuários (para teste)
const initUsers = async () => {
  const users = [
    { email: 'merchant@example.com', password: 'password123', role: 'merchant' },
    { email: 'driver@example.com', password: 'password123', role: 'driver' },
  ];

  for (const user of users) {
    const exists = await User.findOne({ email: user.email });
    if (!exists) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await User.create({ email: user.email, password: hashedPassword, role: user.role });
      console.log(`User ${user.email} created`);
    }
  }
};

initUsers();

app.listen(5000, () => console.log('Server running on port 5000'));