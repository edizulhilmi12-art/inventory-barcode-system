const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { auth, roleCheck } = require('../middleware/auth');

const router = express.Router();

// Get transaction report
router.get('/transactions', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .populate('product')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate summary
    let totalIn = 0, totalOut = 0;
    let valueIn = 0, valueOut = 0;

    transactions.forEach(t => {
      if (t.type === 'in') {
        totalIn += t.quantity;
        valueIn += t.quantity * t.product.buyingPrice;
      } else {
        totalOut += t.quantity;
        valueOut += t.quantity * t.product.sellingPrice;
      }
    });

    res.json({
      success: true,
      summary: {
        totalIn,
        totalOut,
        valueIn,
        valueOut
      },
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get inventory report
router.get('/inventory', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('createdBy', 'name email')
      .sort({ category: 1, name: 1 });

    let totalItems = 0;
    let totalValue = 0;
    let lowStockCount = 0;

    products.forEach(p => {
      totalItems += p.currentStock;
      totalValue += p.currentStock * p.sellingPrice;
      if (p.currentStock <= p.minStock) {
        lowStockCount++;
      }
    });

    res.json({
      success: true,
      summary: {
        totalItems,
        totalValue,
        lowStockCount,
        totalProducts: products.length
      },
      products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
