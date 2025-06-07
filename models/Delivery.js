const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String },
  quantity: { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema({
  products: [productSchema],
  instructions: { type: String },
  total: { type: Number, default: 0 },
});

const deliverySchema = new mongoose.Schema({
  customer: { type: String, required: true },
  address: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked', 'delivered', 'canceled'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  price: { type: Number, default: 0 },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now },
  order: orderSchema,
});

module.exports = mongoose.model('Delivery', deliverySchema);