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

// Middleware básico
app.use(cors());
app.use(express.json());

// Middleware de depuração antes das rotas
app.use((req, res, next) => {
  console.log("Middleware global - req.user antes das rotas:", req.user || "Não definido");
  console.log("Requisição recebida:", req.method, req.url, "Headers:", req.headers);
  next();
});

// Conexão ao MongoDB
const mongoURI = "mongodb://mongodb:27017/nahora"; // Ajustado para Docker
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB com sucesso"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/deliveries", auth, deliveryRoutes);
app.use("/api/categories", auth, categoryRoutes);
app.use("/api/products", auth, productRoutes);
app.use("/api/users", auth, userRoutes);
app.use("/api/stats", auth, statsRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API do NaHora rodando!" });
});

// Middleware de erro (último)
app.use((err, req, res, next) => {
  console.log("Middleware de erro - req.user antes da resposta:", req.user || "Não definido");
  console.error("Erro global capturado:", err.stack);
  res.status(500).json({ message: "Algo deu errado!", error: err.message });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;