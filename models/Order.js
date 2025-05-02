const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'accepted', 'delivered', 'canceled'], default: 'pending' },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
