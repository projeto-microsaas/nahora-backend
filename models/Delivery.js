const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  customer: String,
  address: String,
  items: [String],
  total: Number,
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ["pending", "accepted", "picked", "delivered"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Delivery", deliverySchema);