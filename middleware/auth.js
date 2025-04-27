const jwt = require('jsonwebtoken');

const authMiddleware = (role) => (req, res, next) => {
  console.log('Middleware chamado com role:', role); // Adicionar log
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (role && decoded.role !== role) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = authMiddleware;