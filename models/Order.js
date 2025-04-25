const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  client: { type: String, required: true },
  description: { type: String, required: true },
  value: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
