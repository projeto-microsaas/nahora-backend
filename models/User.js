const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Lojista", "Motorista"], default: "Lojista" },
  name: String,
  phone: String, // Novo campo
  cpf: String,  // Novo campo
});

userSchema.methods.comparePassword = function (candidatePassword) {
  // Implementar lógica de hash (ex.: bcrypt)
  return true; // Placeholder, substitua por bcrypt.compare
};

module.exports = mongoose.model("User", userSchema);