const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  type: String,
  cnpj: String,
  phone: String,
  address: String,
});

module.exports = mongoose.model('Business', BusinessSchema);