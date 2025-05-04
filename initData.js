const mongoose = require('mongoose');
     const bcrypt = require('bcryptjs');
     const User = require('./models/User');

     const initializeData = async () => {
       try {
         console.log('Conectando ao MongoDB...');
         await mongoose.connect('mongodb://mongodb:27017/nahora', {
           useNewUrlParser: true,
           useUnifiedTopology: true,
         });
         console.log('Conectado ao MongoDB com sucesso');

         const users = [
           {
             email: 'merchant@example.com',
             password: 'password123',
             role: 'Comerciante',
             name: 'Comerciante Teste',
           },
           {
             email: 'driver@example.com',
             password: 'password123',
             role: 'Motorista',
             name: 'Motorista Teste',
           },
         ];

         for (const user of users) {
           const existingUser = await User.findOne({ email: user.email, role: user.role });
           if (!existingUser) {
             const salt = bcrypt.genSaltSync(10);
             const hashedPassword = bcrypt.hashSync(user.password, salt);
             await User.create({
               email: user.email,
               password: hashedPassword,
               role: user.role,
               name: user.name,
             });
             console.log(`Usuário criado: ${user.email} (${user.role})`);
           } else {
             console.log(`Usuário já existe: ${user.email} (${user.role})`);
           }
         }

         console.log('Inicialização de dados concluída');
         mongoose.connection.close();
       } catch (err) {
         console.error('Erro ao inicializar dados:', err);
         process.exit(1);
       }
     };

     initializeData();