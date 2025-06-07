const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy'],
    default: 'offline',
  },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Courier', courierSchema);