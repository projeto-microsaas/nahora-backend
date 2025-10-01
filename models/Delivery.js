// /app/models/Delivery.js
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customer: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  pickupAddress: { type: String }, // Novo campo para endereço de coleta
  deliveryAddress: { type: String }, // Novo campo para endereço de entrega
  
  // Sistema de pacotes padronizados
  packageType: { 
    type: String, 
    enum: ['envelope', 'small', 'medium', 'large', 'special'],
    required: true 
  },
  packageDetails: {
    name: { type: String },
    weight: { type: String },
    transport: { type: String },
    specialOptions: {
      isFragile: { type: Boolean, default: false },
      isThermal: { type: Boolean, default: false },
      isUrgent: { type: Boolean, default: false }
    }
  },
  
  // Manter compatibilidade com sistema antigo
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  // Campos para descrição livre
  packageDescription: { type: String }, // Descrição livre do pacote
  packageWeight: { type: String }, // Peso aproximado
  
  // Campos para precificação por distância
  distanceRange: { type: String }, // Faixa de distância selecionada
  basePrice: { type: Number }, // Preço base da distância
  packageMultiplier: { type: Number }, // Multiplicador do tipo de pacote
  
  instructions: { type: String },
  totalPrice: { type: Number, required: true },
  deliveryFee: { type: Number }, // Preço da entrega separado dos produtos
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