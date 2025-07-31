const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

// This file is for any additional order-related endpoints
// Main order functionality is in admin.js and customer.js

// Public endpoint to track order by order ID (without authentication)
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('orderId status createdAt trackingNumber')
      .populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber,
      items: order.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity
      }))
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Server error tracking order' });
  }
});

module.exports = router;