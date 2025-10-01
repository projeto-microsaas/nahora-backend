const mongoose = require("mongoose");
const Address = require("./models/Address");
const User = require("./models/User");

mongoose.connect("mongodb://mongodb:27017/nahora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const initAddresses = async () => {
  try {
    // Buscar usuário existente
    const user = await User.findOne({ email: "thais@gmail.com" });
    
    if (!user) {
      console.log("Usuário não encontrado. Execute primeiro o initData.js");
      return;
    }

    // Verificar se já existem endereços
    const existingAddresses = await Address.find({ merchantId: user._id });
    if (existingAddresses.length > 0) {
      console.log("Endereços já existem para este usuário");
      return;
    }

    // Criar endereços de exemplo
    const addresses = [
      {
        name: "Loja Principal",
        address: "Rua das Flores, 123 - Centro, São Paulo - SP",
        type: "store",
        isDefault: true,
        merchantId: user._id
      },
      {
        name: "Depósito",
        address: "Av. Industrial, 456 - Zona Industrial, São Paulo - SP",
        type: "work",
        isDefault: false,
        merchantId: user._id
      },
      {
        name: "Filial Shopping",
        address: "Shopping Center Norte, Loja 234 - Santana, São Paulo - SP",
        type: "store",
        isDefault: false,
        merchantId: user._id
      }
    ];

    for (const addressData of addresses) {
      const address = new Address(addressData);
      await address.save();
      console.log("Endereço criado:", address.name);
    }

    console.log("Endereços de exemplo criados com sucesso!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Erro ao criar endereços:", error);
    mongoose.connection.close();
  }
};

initAddresses();
