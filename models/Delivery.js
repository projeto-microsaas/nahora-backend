// /app/models/Delivery.js
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customer: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
  instructions: { type: String },
  totalPrice: { type: Number, required: true },
  estimatedArrival: { type: Number, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'scheduled', 'accepted', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  reason: { type: String },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('Delivery', deliverySchema);