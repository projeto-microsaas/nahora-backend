const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Lojista", "Motorista"], default: "Lojista" },
  name: String,
});

(async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);
  console.log("Hashed Password:", hashedPassword);
})();

module.exports = mongoose.model("User", userSchema);