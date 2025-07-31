# Windows Setup Guide

This guide will help you set up the e-commerce application on Windows and resolve common issues.

## 🚨 Quick Fix for Current Issue

The error you're seeing is due to a corrupted Mongoose installation. Follow these steps:

### Step 1: Clean Installation
```cmd
# Delete node_modules and package-lock.json
rmdir /s node_modules
del package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install
```

### Step 2: Test Connection
```cmd
npm run test
```

If the test passes, proceed to seed the database:
```cmd
npm run seed
```

Then start the application:
```cmd
npm run dev
```

## 📋 Prerequisites Setup

### 1. Install Node.js
- Download from: https://nodejs.org/
- Use the LTS version (recommended)
- Verify installation: `node --version`

### 2. Install MongoDB

#### Option A: MongoDB Community Server (Recommended)
1. Download from: https://www.mongodb.com/try/download/community
2. Choose Windows x64 MSI
3. Run installer with default settings
4. MongoDB will install as a Windows service

#### Option B: MongoDB with Chocolatey
```cmd
# Install Chocolatey first (if not installed)
# Then install MongoDB
choco install mongodb
```

### 3. Verify MongoDB Installation
```cmd
# Check if MongoDB service is running
sc query MongoDB

# Or check with net command
net start | findstr MongoDB
```

### 4. Start MongoDB (if not running)
```cmd
# Start MongoDB service
net start MongoDB

# Or use Services app (services.msc)
```

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module" errors
**Solution:** Clean reinstall dependencies
```cmd
rmdir /s node_modules
del package-lock.json
npm cache clean --force
npm install
```

### Issue 2: MongoDB connection failed
**Solution:** Check MongoDB service
```cmd
# Check if MongoDB is running
sc query MongoDB

# Start MongoDB if stopped
net start MongoDB

# Check MongoDB logs (if needed)
# Default location: C:\Program Files\MongoDB\Server\7.0\log\mongod.log
```

### Issue 3: Port 3000 already in use
**Solution:** Kill the process or change port
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env file
# PORT=3001
```

### Issue 4: Permission errors
**Solution:** Run as administrator or fix permissions
```cmd
# Run command prompt as administrator
# Or fix npm permissions
npm config set cache C:\Users\%USERNAME%\AppData\Roaming\npm-cache --global
```

## 🗂️ MongoDB Data Location

Default MongoDB data directory on Windows:
```
C:\Program Files\MongoDB\Server\7.0\data\
```

To change data directory, edit MongoDB config:
```
C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
```

## 🚀 Alternative: MongoDB Atlas (Cloud)

If local MongoDB is problematic, use MongoDB Atlas:

1. Create account at: https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce_app
```

## 🧪 Testing Your Setup

### Test 1: Node.js and Dependencies
```cmd
node --version
npm --version
```

### Test 2: MongoDB Connection
```cmd
npm run test
```

### Test 3: Full Application
```cmd
npm run seed
npm run dev
```

## 📱 Accessing the Application

Once running successfully:
- **Customer Portal**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin

### Default Login Credentials:
- **Admin**: admin@example.com / admin123
- **Customer**: alice@example.com / password123

## 🆘 Still Having Issues?

### Check System Requirements:
- Windows 10/11
- Node.js 16+ (LTS recommended)
- MongoDB 4.4+ or MongoDB Atlas
- At least 2GB RAM
- 1GB free disk space

### Debug Steps:
1. Check Windows Event Viewer for system errors
2. Verify antivirus isn't blocking MongoDB
3. Check Windows Firewall settings
4. Try running PowerShell as Administrator

### Alternative Installation:
If issues persist, try using Docker:
```cmd
# Install Docker Desktop for Windows
# Then run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Get Help:
- MongoDB Community: https://community.mongodb.com/
- Node.js Documentation: https://nodejs.org/docs/
- Stack Overflow: Search for specific error messages

## 📝 Environment Variables

Make sure your `.env` file contains:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce_app
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
NODE_ENV=development
```

## 🔄 Complete Reset

If all else fails, complete reset:
```cmd
# 1. Stop all Node processes
taskkill /f /im node.exe

# 2. Stop MongoDB
net stop MongoDB

# 3. Clean project
rmdir /s node_modules
del package-lock.json

# 4. Restart MongoDB
net start MongoDB

# 5. Reinstall everything
npm cache clean --force
npm install

# 6. Test and run
npm run test
npm run seed
npm run dev
```

---

**Need more help?** Create an issue with your specific error message and system details.