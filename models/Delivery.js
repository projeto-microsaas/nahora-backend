const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
  pickupAddress: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  recipient: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  weight: { type: Number, required: true },
  value: { type: Number, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});
module.exports = mongoose.model('Delivery', deliverySchema);
