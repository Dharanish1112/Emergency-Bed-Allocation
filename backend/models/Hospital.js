const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  bedsAvailable: {
    type: Number,
    required: true
  },
  bedTypes: {
    icu: { type: Number, default: 0 },
    emergency: { type: Number, default: 0 },
    general: { type: Number, default: 0 },
    private: { type: Number, default: 0 },
    deluxe: { type: Number, default: 0 }
  },
  speciality: {
    type: String,
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  address: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);
