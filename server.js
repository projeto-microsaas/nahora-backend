const express = require('express');
const cors = require('cors'); // Importe o cors
const app = express();

// Configure o CORS para permitir requisições de http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (email === 'merchant@example.com' && password === 'password123' && role === 'Comerciante') {
    res.json({ token: 'fake-jwt-token', user: { email, role } });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});