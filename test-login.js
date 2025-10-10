const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testLogin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/nahora', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado ao MongoDB');

    // Buscar usuários
    const users = await User.find({});
    console.log('👥 Usuários encontrados:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Nome: ${user.name}, Role: ${user.role}`);
    });

    // Testar senha do usuário thais@gmail.com
    const user = await User.findOne({ email: 'thais@gmail.com' });
    if (user) {
      console.log('\n🔍 Testando senhas para thais@gmail.com:');
      
      const passwords = ['teste1234', '123456', 'password123', 'test123'];
      for (const password of passwords) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`- Senha "${password}": ${isMatch ? '✅ CORRETA' : '❌ Incorreta'}`);
      }
    }

    // Testar senha do usuário test@example.com
    const user2 = await User.findOne({ email: 'test@example.com' });
    if (user2) {
      console.log('\n🔍 Testando senhas para test@example.com:');
      
      const passwords = ['password123', '123456', 'teste1234', 'test123'];
      for (const password of passwords) {
        const isMatch = await bcrypt.compare(password, user2.password);
        console.log(`- Senha "${password}": ${isMatch ? '✅ CORRETA' : '❌ Incorreta'}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testLogin();
