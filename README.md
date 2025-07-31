# Full-Stack E-Commerce Application

A complete e-commerce platform with separate customer and admin portals built with Node.js, MongoDB, and vanilla HTML/CSS/JS.

## 🚀 Features

### Customer Portal
- **Authentication**: User registration and login with JWT
- **Product Browsing**: Search, filter, and sort products with pagination
- **Shopping Cart**: Add/remove items, update quantities, persistent cart
- **Checkout Process**: Multi-step checkout with shipping information
- **Order Management**: View order history and track orders
- **Profile Management**: Update profile information and change password
- **Responsive Design**: Mobile-friendly interface

### Admin Portal
- **Dashboard**: Overview with key statistics
- **Product Management**: Full CRUD operations with image upload
- **Customer Management**: View, block/unblock, and impersonate customers
- **Order Management**: View, update status, and manage all orders
- **Settings**: Customize customer portal branding and content
- **Advanced Features**: Pagination, sorting, filtering, and search

## 🛠 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **File Upload**: Multer for image handling
- **Validation**: Express-validator

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🔧 Installation & Setup

> **Windows Users**: If you encounter issues, see [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed troubleshooting.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fullstack-ecommerce-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   **If you get dependency errors (especially on Windows):**
   ```bash
   # Clean installation
   rm -rf node_modules package-lock.json  # Linux/Mac
   # OR
   rmdir /s node_modules && del package-lock.json  # Windows
   
   npm cache clean --force
   npm install
   ```

3. **Environment Configuration**
   
   The `.env` file is already configured with default values:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/ecommerce_app
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   NODE_ENV=development
   ```

   **Important**: Change the `JWT_SECRET` in production!

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # For local MongoDB installation
   mongod
   
   # Or if using MongoDB as a service
   sudo service mongod start
   ```

5. **Test the Setup (Recommended)**
   ```bash
   npm run test
   ```
   
   This will verify your MongoDB connection is working properly.

6. **Seed the Database**
   ```bash
   npm run seed
   ```
   
   This will create:
   - Admin user: `admin@example.com` / `admin123`
   - Sample customers and products
   - Default settings

7. **Start the Application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Or production mode
   npm start
   ```

8. **Access the Application**
   - **Customer Portal**: http://localhost:3000
   - **Admin Portal**: http://localhost:3000/admin

## 🔐 Default Credentials

### Admin Login
- **Email**: admin@example.com
- **Password**: admin123

### Sample Customer Accounts
- **Alice Smith**: alice@example.com / password123
- **John Doe**: john@example.com / password123
- **Sarah Johnson**: sarah@example.com / password123

## 📱 Usage Guide

### Customer Portal

1. **Registration/Login**
   - New users can register with email, name, and password
   - Existing users can login with email and password

2. **Product Browsing**
   - Browse all products or filter by category
   - Search products by name or description
   - Sort by price, name, or date added

3. **Shopping Cart**
   - Add products to cart from product listing or detail view
   - Adjust quantities or remove items
   - Cart persists across browser sessions

4. **Checkout Process**
   - Review cart items
   - Enter shipping information
   - Confirm and place order

5. **Order Management**
   - View order history with status tracking
   - See detailed order information

6. **Profile Management**
   - Update personal information
   - Change password securely

### Admin Portal

1. **Dashboard**
   - View key statistics (products, customers, orders)
   - Quick overview of business metrics

2. **Product Management**
   - Add new products with images
   - Edit existing products
   - Delete products (with order validation)
   - Search, sort, and filter products

3. **Customer Management**
   - View all customer accounts
   - Block/unblock customer access
   - View customer order history
   - Impersonate customers for support

4. **Order Management**
   - View all orders with filtering options
   - Update order status and tracking
   - View detailed order information
   - Filter by date range, status, or customer

5. **Settings**
   - Customize customer portal branding
   - Upload logo and set colors
   - Add custom HTML content to homepage

## 🏗 Project Structure

```
├── models/                 # MongoDB schemas
│   ├── User.js            # User model (customers & admins)
│   ├── Product.js         # Product model
│   ├── Order.js           # Order model
│   └── Settings.js        # Portal settings model
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── admin.js           # Admin API routes
│   ├── customer.js        # Customer API routes
│   ├── products.js        # Public product routes
│   └── orders.js          # Order-related routes
├── middleware/             # Custom middleware
│   └── auth.js            # JWT authentication middleware
├── public/                 # Static frontend files
│   ├── admin/             # Admin portal
│   │   ├── index.html     # Admin HTML
│   │   └── admin.js       # Admin JavaScript
│   ├── customer/          # Customer portal
│   │   ├── index.html     # Customer HTML
│   │   └── customer.js    # Customer JavaScript
│   ├── css/               # Shared styles
│   │   └── common.css     # Common CSS framework
│   └── js/                # Shared JavaScript
│       └── api.js         # API utility functions
├── scripts/               # Utility scripts
│   └── seed.js            # Database seeding script
├── uploads/               # File upload directory
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── .env                   # Environment configuration
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: Server-side validation for all inputs
- **Role-Based Access**: Separate customer and admin permissions
- **File Upload Security**: Image validation and size limits
- **CORS Protection**: Cross-origin request handling

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Customer login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products (Public)
- `GET /api/products` - Get products with pagination/filtering
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories/list` - Get product categories

### Customer Routes (Authenticated)
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update customer profile
- `PUT /api/customer/password` - Change password
- `GET /api/customer/orders` - Get customer orders
- `POST /api/customer/orders` - Place new order

### Admin Routes (Admin Only)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/products` - Get all products (admin view)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:id/status` - Update order status

## 🎨 Customization

The admin can customize the customer portal through the Settings page:

- **Logo Upload**: Replace the default logo
- **Color Scheme**: Set primary and secondary colors
- **Typography**: Choose from available font families
- **Homepage Content**: Add custom HTML content to the hero section

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use a strong, unique `JWT_SECRET`
   - Configure production MongoDB URI

2. **Security**
   - Enable HTTPS
   - Set up proper CORS policies
   - Implement rate limiting
   - Use environment-specific configurations

3. **Database**
   - Use MongoDB Atlas or a managed MongoDB service
   - Set up proper indexes for performance
   - Implement backup strategies

4. **File Storage**
   - Consider using cloud storage (AWS S3, Cloudinary) for images
   - Implement CDN for better performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify database permissions

2. **Port Already in Use**
   - Change the PORT in `.env`
   - Kill existing processes on port 3000

3. **File Upload Issues**
   - Ensure the `uploads/` directory exists
   - Check file permissions
   - Verify file size limits

4. **Authentication Problems**
   - Clear browser localStorage
   - Check JWT_SECRET configuration
   - Verify token expiration settings

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running and accessible
4. Check the `.env` configuration

## 📞 Support

For support, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using Node.js, MongoDB, and vanilla JavaScript**