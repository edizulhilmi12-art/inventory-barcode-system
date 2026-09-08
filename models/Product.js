const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  buyingPrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  minStock: {
    type: Number,
    default: 10
  },
  currentStock: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  image: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Product', productSchema);
