const express = require('express');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get inventory summary
router.get('/summary', auth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ status: 'active' });
    const lowStockProducts = await Product.countDocuments({
      currentStock: { $lte: { $ref: 'minStock' } },
      status: 'active'
    });

    const allProducts = await Product.find({ status: 'active' });
    const totalValue = allProducts.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0);

    res.json({
      success: true,
      summary: {
        totalProducts,
        lowStockProducts: await Product.countDocuments({
          status: 'active'
        }).then(async () => {
          return await Product.find({ status: 'active' }).then(products => 
            products.filter(p => p.currentStock <= p.minStock).length
          );
        }),
        totalInventoryValue: totalValue
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get low stock products
router.get('/low-stock', auth, async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('createdBy', 'name email')
      .sort({ currentStock: 1 });

    const lowStock = products.filter(p => p.currentStock <= p.minStock);

    res.json({
      success: true,
      count: lowStock.length,
      products: lowStock
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get inventory by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      status: 'active'
    }).populate('createdBy', 'name email');

    res.json({
      success: true,
      count: products.length,
      category: req.params.category,
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
