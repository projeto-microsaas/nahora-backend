const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customer: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'picked', 'delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Delivery', deliverySchema);