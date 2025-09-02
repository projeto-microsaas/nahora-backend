const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customer: { type: String, required: true },
  address: { type: String, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  status: { type: String, default: 'pending' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, required: true }, // Novo campo para o valor total
  estimatedArrival: { type: Number, default: 0 }, // Novo campo para tempo estimado (em minutos)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Delivery', deliverySchema);