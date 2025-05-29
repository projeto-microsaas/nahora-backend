const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/statsRoutes");
const orderRoutes = require("./routes/orderRoutes");
const auth = require("./middleware/auth");

const app = express();
require("dotenv").config();

// Middleware
app.use(cors()); // Permite requisições de origens diferentes
app.use(express.json()); // Para parsear JSON no body das requisições

// Conexão ao MongoDB
const mongoURI = process.env.MONGO_URI || "mongodb://mongodb:27017/nahora"; // URI do MongoDB, padrão para Docker
console.log("Tentando conectar ao MongoDB com URI:", mongoURI); // Log para depuração
mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Rotas
app.use("/api/auth", authRoutes); // Rotas de autenticação
app.use("/api/deliveries", auth, deliveryRoutes); // Rotas de entregas
app.use("/api/categories", auth, categoryRoutes); // Rotas de categorias
app.use("/api/products", auth, productRoutes); // Rotas de produtos
app.use("/api/users", auth, userRoutes); // Rotas de usuários
app.use("/api/stats", auth, statsRoutes); // Rotas de estatísticas
app.use("/api/orders", auth, orderRoutes); // Rotas de pedidos

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API do Javai Delivery rodando!" });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Algo deu errado!", error: err.message });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;