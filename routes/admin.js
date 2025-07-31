const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [totalProducts, totalCustomers, orderStats] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const ordersByStatus = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orderStats.forEach(stat => {
      ordersByStatus[stat._id] = stat.count;
    });

    res.json({
      totalProducts,
      totalCustomers,
      orders: ordersByStatus
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// ===== PRODUCT MANAGEMENT =====

// Get all products with pagination, sorting, and filtering
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// Create product
router.post('/products', upload.single('image'), [
  body('name').trim().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('stockQuantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      stockQuantity: parseInt(req.body.stockQuantity),
      category: req.body.category || ''
    };

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// Update product
router.put('/products/:id', upload.single('image'), [
  body('name').trim().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('stockQuantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      stockQuantity: parseInt(req.body.stockQuantity),
      category: req.body.category || ''
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    // Check if product exists in any orders
    const orderWithProduct = await Order.findOne({
      'items.product': req.params.id
    });

    if (orderWithProduct) {
      return res.status(400).json({ 
        message: 'Cannot delete product that exists in orders. Consider deactivating instead.' 
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// ===== CUSTOMER MANAGEMENT =====

// Get all customers with pagination and filtering
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const status = req.query.status; // 'active', 'blocked', or undefined for all
    
    const filter = { role: 'customer' };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      filter.isBlocked = false;
    } else if (status === 'blocked') {
      filter.isBlocked = true;
    }

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({
      customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error fetching customers' });
  }
});

// Get single customer with order history
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await User.findOne({ 
      _id: req.params.id, 
      role: 'customer' 
    }).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({ customer: req.params.id })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json({ customer, orders });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error fetching customer' });
  }
});

// Update customer
router.put('/customers/:id', [
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    };

    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error updating customer' });
  }
});

// Block/Unblock customer
router.patch('/customers/:id/block', async (req, res) => {
  try {
    const { isBlocked } = req.body;
    
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' },
      { isBlocked: Boolean(isBlocked) },
      { new: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ 
      message: `Customer ${isBlocked ? 'blocked' : 'unblocked'} successfully`, 
      customer 
    });
  } catch (error) {
    console.error('Block customer error:', error);
    res.status(500).json({ message: 'Server error updating customer status' });
  }
});

// Delete customer
router.delete('/customers/:id', async (req, res) => {
  try {
    // Check if customer has orders
    const customerOrders = await Order.countDocuments({ customer: req.params.id });
    
    if (customerOrders > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with existing orders. Consider blocking instead.' 
      });
    }

    const customer = await User.findOneAndDelete({ 
      _id: req.params.id, 
      role: 'customer' 
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
});

// ===== ORDER MANAGEMENT =====

// Get all orders with filtering and pagination
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Get single order
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
});

// Update order status
router.patch('/orders/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, trackingNumber } = req.body;
    
    const updateData = { status };
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
});

// Delete order
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error deleting order' });
  }
});

// ===== SETTINGS MANAGEMENT =====

// Get settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
});

// Update settings
router.put('/settings', upload.single('logo'), async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    
    if (req.body.primaryColor) {
      settings.branding.primaryColor = req.body.primaryColor;
    }
    
    if (req.body.secondaryColor) {
      settings.branding.secondaryColor = req.body.secondaryColor;
    }
    
    if (req.body.fontFamily) {
      settings.branding.fontFamily = req.body.fontFamily;
    }
    
    if (req.body.customHtml) {
      settings.dashboard.customHtml = req.body.customHtml;
    }
    
    if (req.file) {
      settings.branding.logo = `/uploads/${req.file.filename}`;
    }

    await settings.save();
    
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

module.exports = router;