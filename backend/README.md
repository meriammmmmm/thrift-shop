# Thrift Shop Backend API

A complete REST API backend for the Thrift Shop application built with Express.js and SQLite.

## 🚀 Quick Start

### Installation
```bash
cd backend
npm install
```

### Environment Setup
Create a `.env` file with:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
DB_PATH=./database/thrift_shop.db
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@thriftshop.com
ADMIN_PASSWORD=admin123
```

### Database Setup
```bash
# Seed the database with sample data
npm run seed
```

### Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/meta/categories` - Get all categories
- `GET /api/products/meta/brands` - Get all brands

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/wishlist` - Get user wishlist
- `POST /api/users/wishlist/:productId` - Add to wishlist
- `DELETE /api/users/wishlist/:productId` - Remove from wishlist
- `POST /api/users/reviews` - Add product review
- `GET /api/users/reviews` - Get user reviews

### Admin
- `GET /api/admin/dashboard` - Get dashboard analytics
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Get all users

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📝 Sample Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@thriftshop.com",
    "password": "admin123"
  }'
```

### Get Products
```bash
curl http://localhost:5000/api/products?category=Jackets&limit=10
```

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 1}
    ],
    "shipping_address": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102"
    },
    "billing_address": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102"
    },
    "payment_method": "Credit Card"
  }'
```

## 🗄️ Database Schema

### Users
- id, email, name, password, role, created_at, updated_at

### Products
- id, name, description, price, original_price, images, brand, size, category, condition, color, in_stock, material, measurements, care_instructions, tags, seller info, views, likes, timestamps

### Orders
- id, user_id, status, totals, payment info, addresses, timestamps

### Order Items
- id, order_id, product_id, quantity, price

### Wishlist
- id, user_id, product_id, created_at

### Reviews
- id, user_id, product_id, rating, comment, created_at

## 🔧 Features

- ✅ User authentication & authorization
- ✅ Product catalog with filtering & search
- ✅ Shopping cart & order management
- ✅ Wishlist functionality
- ✅ Product reviews & ratings
- ✅ Admin dashboard with analytics
- ✅ User profile management
- ✅ Order status tracking
- ✅ Security middleware (helmet, rate limiting)
- ✅ CORS configuration
- ✅ Error handling

## 🚀 Deployment

The backend can be deployed to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/Google Cloud

Make sure to:
1. Set environment variables
2. Update FRONTEND_URL to your deployed frontend URL
3. Use a production database (PostgreSQL recommended)

## 📊 Default Credentials

**Admin:**
- Email: admin@thriftshop.com
- Password: admin123

**Test User:**
- Email: user@example.com
- Password: user123