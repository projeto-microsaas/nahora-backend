const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Já incluído
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nahora';

console.log('Tentando conectar ao MongoDB com URI:', MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 30000,
})
  .then(async () => {
    console.log('Conectado ao MongoDB com sucesso');
    const user = await User.findOne({ email: 'merchant@example.com' });
    if (user) {
      console.log('Usuário já existe:', user.email);
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10); // Hash da senha

    const newUser = new User({
      name: 'Merchant User',
      email: 'merchant@example.com',
      password: hashedPassword, // Use a senha hashada
      role: 'Comerciante',
    });

    await newUser.save();
    console.log('Usuário criado:', newUser.email);
  })
  .catch(err => {
    console.error('Erro ao criar usuário:', err);
  })
  .finally(() => {
    console.log('Fechando conexão com MongoDB');
    mongoose.connection.close();
  });