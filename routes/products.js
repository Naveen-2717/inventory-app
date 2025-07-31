const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

const router = express.Router();

// Apply optional authentication to get user context if available
router.use(optionalAuth);

// Get all products with pagination, sorting, and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const category = req.query.category;
    
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { 
      isActive: true,
      category: { $ne: '' }
    });
    
    res.json(categories.filter(cat => cat && cat.trim()));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// Get customer portal settings
router.get('/settings/portal', async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({
      branding: settings.branding,
      dashboard: settings.dashboard
    });
  } catch (error) {
    console.error('Get portal settings error:', error);
    res.status(500).json({ message: 'Server error fetching portal settings' });
  }
});

module.exports = router;