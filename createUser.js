const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Configurar strictQuery para suprimir o aviso de depreciação
mongoose.set('strictQuery', true);

mongoose.connect('mongodb://mongo:27017/nahora')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

const createUser = async () => {
  try {
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email: 'merchant@example.com' });
    if (existingUser) {
      console.log('Usuário já existe:', existingUser);
      mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      email: 'merchant@example.com',
      password: hashedPassword,
      role: 'merchant',
      name: 'Merchant User'
    });
    await user.save();
    console.log('Usuário criado com sucesso:', user);
    mongoose.connection.close();
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    mongoose.connection.close();
  }
};

createUser();
