const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  hospitalId: {
    type: String,
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  driverId: {
    type: String,
    required: true
  },
  driverName: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: {
    type: Number,
    default: null
  },
  patientPhone: {
    type: String,
    required: true
  },
  emergencyType: {
    type: String,
    enum: ['normal', 'emergency', 'critical'],
    default: 'normal'
  },
  bedType: {
    type: String,
    enum: ['general', 'icu', 'emergency', 'private', 'deluxe'],
    default: 'general'
  },
  notes: {
    type: String,
    default: ''
  },
  eta: {
    type: String,
    default: ''
  },
  distance: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  isNew: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['manual', 'voice'],
    default: 'manual'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
