const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: String
  },
  orderNotes: String,
  trackingNumber: String
}, {
  timestamps: true
});

// Generate order ID before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.models.Order.countDocuments();
    this.orderId = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate total amount
orderSchema.methods.calculateTotal = function() {
  this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  return this.totalAmount;
};

module.exports = mongoose.model('Order', orderSchema);