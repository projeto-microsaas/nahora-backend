const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/nahora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const initData = async () => {
  try {
    // Verificar se usuário já existe antes de criar
    const existingUser = await User.findOne({ email: "thais@gmail.com" });
    if (!existingUser) {
      const user = new User({
        name: "Thais",
        email: "thais@gmail.com",
        password: await bcrypt.hash("teste1234", 10),
        role: "Lojista",
      });
      await user.save();
      console.log("Usuário criado:", user.email);
    } else {
      console.log("Usuário já existe:", existingUser.email);
    }
    
    // Verificar se usuário adicional já existe
    const existingUser2 = await User.findOne({ email: "test@example.com" });
    if (!existingUser2) {
      const user2 = new User({
        name: "Test User",
        email: "test@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "Lojista",
      });
      await user2.save();
      console.log("Usuário criado:", user2.email);
    } else {
      console.log("Usuário já existe:", existingUser2.email);
    }
    
    console.log("✅ Dados inicializados com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar dados:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

initData().catch(console.error);