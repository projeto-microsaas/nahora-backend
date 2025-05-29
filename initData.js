const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb://mongodb:27017/nahora", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const initData = async () => {
  const user = new User({
    name: "Test User",
    email: "test@example.com",
    password: await bcrypt.hash("password123", 10),
    role: "Lojista",
  });
  await user.save();
  console.log("Usuário criado:", user.email);
  mongoose.connection.close();
};

initData().catch(console.error);