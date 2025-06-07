const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("Token recebido no middleware auth:", token);

  if (!token) {
    console.log("Nenhum token fornecido.");
    return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET não definido nas variáveis de ambiente");
      throw new Error("Configuração inválida: JWT_SECRET ausente");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decodificado com sucesso:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erro ao verificar token:", error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token inválido ou expirado", error: error.message });
    }
    return res.status(500).json({ message: "Erro interno ao verificar token", error: error.message });
  }
};