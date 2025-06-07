const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Lojista", "Motorista"], default: "Lojista" },
  name: String,
});

module.exports = mongoose.model("User", userSchema);