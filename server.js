const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "your_jwt_secret"; // Definida como constante

mongoose.connect("mongodb://mongodb:27017/nahora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Conectado ao MongoDB com sucesso"))
  .catch(err => console.error("Erro na conexão com MongoDB:", err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const deliverySchema = new mongoose.Schema({
  customer: String,
  phone: String,
  pickupAddress: String,
  deliveryAddress: String,
  packageDetails: String,
  instructions: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Delivery = mongoose.model("Delivery", deliverySchema);

// Rota de login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Usuário não encontrado" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Senha incorreta" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware para proteger rotas
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token não fornecido" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Erro ao verificar token:", err.message, "Token:", token); // Log detalhado
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    next();
  });
};

// Rota para buscar entregas
app.get("/api/deliveries", authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status: { $in: status.split(",") } } : {};
    const deliveries = await Delivery.find(query);
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... (outras rotas como /api/register, /api/deliveries POST, etc.)

app.listen(5000, () => {
  console.log("Backend rodando na porta 5000");
});