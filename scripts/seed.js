const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Created admin user: admin@example.com / admin123');

    // Create sample customers
    const customers = [
      {
        email: 'alice@example.com',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Smith',
        role: 'customer'
      },
      {
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      },
      {
        email: 'sarah@example.com',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'customer'
      }
    ];

    for (const customerData of customers) {
      const customer = new User(customerData);
      await customer.save();
    }
    console.log('Created sample customers');

    // Create sample products
    const products = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and long battery life.',
        price: 99.99,
        stockQuantity: 50,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Smartphone Case',
        description: 'Durable protective case for smartphones with shock absorption.',
        price: 24.99,
        stockQuantity: 100,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'USB-C Charging Cable',
        description: 'Fast charging USB-C cable compatible with most modern devices.',
        price: 15.99,
        stockQuantity: 200,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking and long battery life.',
        price: 39.99,
        stockQuantity: 75,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Laptop Stand',
        description: 'Adjustable aluminum laptop stand for better ergonomics and cooling.',
        price: 49.99,
        stockQuantity: 30,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Portable Power Bank',
        description: '10000mAh portable charger with fast charging and multiple ports.',
        price: 34.99,
        stockQuantity: 60,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Compact waterproof Bluetooth speaker with excellent sound quality.',
        price: 79.99,
        stockQuantity: 40,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Keyboard Cover',
        description: 'Silicone keyboard cover to protect against dust and spills.',
        price: 12.99,
        stockQuantity: 150,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Webcam HD',
        description: '1080p HD webcam with auto-focus and built-in microphone.',
        price: 69.99,
        stockQuantity: 25,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Phone Ring Holder',
        description: 'Adjustable ring holder for phones with 360-degree rotation.',
        price: 8.99,
        stockQuantity: 300,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Tablet Screen Protector',
        description: 'Tempered glass screen protector for tablets with bubble-free installation.',
        price: 19.99,
        stockQuantity: 80,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Gaming Keyboard',
        description: 'Mechanical gaming keyboard with RGB backlighting and programmable keys.',
        price: 129.99,
        stockQuantity: 20,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Car Phone Mount',
        description: 'Universal car phone mount with strong suction cup and adjustable arm.',
        price: 22.99,
        stockQuantity: 90,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad compatible with Qi-enabled devices.',
        price: 29.99,
        stockQuantity: 70,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Cable Organizer',
        description: 'Multi-slot cable organizer to keep your desk tidy and cables untangled.',
        price: 16.99,
        stockQuantity: 120,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Smart Watch Band',
        description: 'Comfortable silicone band for smart watches in various colors.',
        price: 18.99,
        stockQuantity: 200,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'USB Hub',
        description: '7-port USB 3.0 hub with individual power switches and LED indicators.',
        price: 45.99,
        stockQuantity: 35,
        category: 'Electronics',
        isActive: true
      },
      {
        name: 'Monitor Stand',
        description: 'Height-adjustable monitor stand with storage space underneath.',
        price: 59.99,
        stockQuantity: 25,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Earbuds Case',
        description: 'Protective carrying case for wireless earbuds with carabiner clip.',
        price: 14.99,
        stockQuantity: 180,
        category: 'Accessories',
        isActive: true
      },
      {
        name: 'Desk Lamp LED',
        description: 'Adjustable LED desk lamp with touch control and USB charging port.',
        price: 89.99,
        stockQuantity: 15,
        category: 'Electronics',
        isActive: true
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
    }
    console.log(`Created ${products.length} sample products`);

    // Create default settings
    const settings = new Settings({
      branding: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Roboto'
      },
      dashboard: {
        customHtml: '<h2>Welcome to TechStore!</h2><p>Discover the latest electronics and accessories at unbeatable prices.</p>'
      }
    });
    await settings.save();
    console.log('Created default settings');

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Admin Login:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nSample Customer Logins:');
    console.log('Email: alice@example.com | Password: password123');
    console.log('Email: john@example.com | Password: password123');
    console.log('Email: sarah@example.com | Password: password123');
    console.log('\nYou can now start the server with: npm run dev');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

seedDatabase();