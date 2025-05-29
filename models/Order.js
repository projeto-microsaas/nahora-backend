const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  description: { type: String, required: true },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  acceptedAt: Date,
});

module.exports = mongoose.model("Order", orderSchema);