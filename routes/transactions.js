const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (type) filter.type = type;

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('product')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      transactions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create transaction (Scan Barcode)
router.post('/', auth, async (req, res) => {
  try {
    const { barcode, type, quantity, notes, reference } = req.body;

    // Find product by barcode
    const product = await Product.findOne({ barcode });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Validate quantity for outgoing transactions
    if (type === 'out' && product.currentStock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Available: ${product.currentStock}` 
      });
    }

    // Create transaction
    const transaction = new Transaction({
      type,
      product: product._id,
      quantity,
      notes,
      reference,
      createdBy: req.user.id
    });

    await transaction.save();

    // Update product stock
    if (type === 'in') {
      product.currentStock += quantity;
    } else {
      product.currentStock -= quantity;
    }
    await product.save();

    await transaction.populate('product');
    await transaction.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: `Transaction created successfully. New stock: ${product.currentStock}`,
      transaction,
      currentStock: product.currentStock
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get transaction detail
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('product')
      .populate('createdBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
