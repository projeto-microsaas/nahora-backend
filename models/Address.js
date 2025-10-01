const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  street: { 
    type: String, 
    required: true,
    trim: true
  },
  number: { 
    type: String, 
    required: true,
    trim: true
  },
  neighborhood: { 
    type: String, 
    required: true,
    trim: true
  },
  city: { 
    type: String, 
    required: true,
    trim: true
  },
  state: { 
    type: String, 
    required: true,
    trim: true
  },
  zipCode: { 
    type: String, 
    trim: true
  },
  complement: { 
    type: String, 
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  merchantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware para atualizar updatedAt
addressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para melhor performance
addressSchema.index({ merchantId: 1 });
addressSchema.index({ merchantId: 1, isDefault: 1 });

module.exports = mongoose.model('Address', addressSchema);
