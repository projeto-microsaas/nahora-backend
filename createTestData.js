const mongoose = require('mongoose');
const Delivery = require('./models/Delivery');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/nahora', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestData = async () => {
  try {
    // Buscar o usuário de teste
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('Usuário de teste não encontrado');
      return;
    }

    console.log('Usuário encontrado:', user.email);

    // Criar entregas de exemplo
    const testDeliveries = [
      {
        customer: 'João Silva',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123 - São Paulo, SP',
        packageType: 'medium',
        packageDetails: {
          name: 'Pacote médio',
          weight: '2kg',
          transport: 'Mochila'
        },
        products: [],
        instructions: 'Entregar na portaria',
        totalPrice: 25.50,
        estimatedArrival: 30,
        merchantId: user._id,
        status: 'completed',
        completedAt: new Date(Date.now() - 86400000), // 1 dia atrás
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        customer: 'Maria Santos',
        phone: '(11) 88888-8888',
        address: 'Av. Paulista, 456 - São Paulo, SP',
        packageType: 'large',
        packageDetails: {
          name: 'Pacote grande',
          weight: '5kg',
          transport: 'Baú'
        },
        products: [],
        instructions: 'Ligar antes de entregar',
        totalPrice: 45.00,
        estimatedArrival: 45,
        merchantId: user._id,
        status: 'completed',
        completedAt: new Date(Date.now() - 172800000), // 2 dias atrás
        createdAt: new Date(Date.now() - 172800000)
      },
      {
        customer: 'Pedro Costa',
        phone: '(11) 77777-7777',
        address: 'Rua Augusta, 789 - São Paulo, SP',
        packageType: 'small',
        packageDetails: {
          name: 'Pacote pequeno',
          weight: '1kg',
          transport: 'Mochila'
        },
        products: [],
        instructions: 'Entregar após 18h',
        totalPrice: 32.75,
        estimatedArrival: 25,
        merchantId: user._id,
        status: 'cancelled',
        reason: 'Cliente cancelou',
        createdAt: new Date(Date.now() - 259200000) // 3 dias atrás
      },
      {
        customer: 'Ana Oliveira',
        phone: '(11) 66666-6666',
        address: 'Rua Oscar Freire, 321 - São Paulo, SP',
        packageType: 'envelope',
        packageDetails: {
          name: 'Envelope',
          weight: '0.2kg',
          transport: 'Mochila'
        },
        products: [],
        instructions: 'Entregar no apartamento 45',
        totalPrice: 18.90,
        estimatedArrival: 20,
        merchantId: user._id,
        status: 'completed',
        completedAt: new Date(Date.now() - 345600000), // 4 dias atrás
        createdAt: new Date(Date.now() - 345600000)
      }
    ];

    // Limpar entregas existentes
    await Delivery.deleteMany({ merchantId: user._id });
    console.log('Entregas antigas removidas');

    // Criar novas entregas
    const createdDeliveries = await Delivery.insertMany(testDeliveries);
    console.log(`${createdDeliveries.length} entregas de teste criadas`);

    // Verificar se foram criadas
    const allDeliveries = await Delivery.find({ merchantId: user._id });
    console.log('Total de entregas no banco:', allDeliveries.length);

  } catch (error) {
    console.error('Erro ao criar dados de teste:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestData();
