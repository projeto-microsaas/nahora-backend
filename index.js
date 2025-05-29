const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/statsRoutes");
const auth = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors()); // Permite requisições de origens diferentes (ex.: frontend em localhost:3000)
app.use(express.json()); // Para parsear JSON no body das requisições

// Conexão ao MongoDB
const mongoURI = "mongodb://localhost:27017/javai-delivery"; // Ajuste para sua URL do MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Rotas
app.use("/api/auth", authRoutes); // Rotas de autenticação (login, registro, etc.)
app.use("/api/deliveries", auth, deliveryRoutes); // Rotas de entregas (protegidas por autenticação)
app.use("/api/categories", auth, categoryRoutes); // Rotas de categorias (protegidas por autenticação)
app.use("/api/products", auth, productRoutes); // Rotas de produtos (protegidas por autenticação)
app.use("/api/users", auth, userRoutes); // Rotas de usuários (protegidas por autenticação)
app.use("/api/stats", auth, statsRoutes); // Rotas de estatísticas (protegidas por autenticação)

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