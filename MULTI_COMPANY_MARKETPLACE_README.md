# Multi-Company Thrift Shop Marketplace

## Overview

This system has been transformed into a **multi-company marketplace** where different thrift clothing companies can operate their own stores while customers browse and buy from all companies in one unified platform.

## 🏢 How It Works

### For Companies (Admin Side)
- Each thrift clothing company has its own admin account
- Companies can only manage their own products, orders, and data
- Each company has separate analytics and reporting
- Companies earn revenue from their own sales

### For Customers (User Side)
- Customers see products from ALL companies in one unified store
- Products display which company they're from
- Customers can buy from multiple companies in a single order
- Unified shopping experience across all companies

## 🚀 Getting Started

### 1. Start the Backend Server
```bash
cd backend
npm start
```

### 2. Start the Frontend (Customer Store)
```bash
cd thrift-shop
npm run dev
```

### 3. Start the Admin Panel
```bash
cd admin-panel
npm run build  # Build the admin panel
# Then open http://localhost:8080 in your browser
```

## 👥 Demo Companies & Admin Accounts

The system comes with 3 pre-configured companies:

### 1. 🏪 Vintage Treasures
- **Email:** `admin@vintagetreasures.com`
- **Password:** `admin123`
- **Focus:** Premium vintage clothing and accessories from the 60s-90s
- **Commission:** 5%

### 2. 🌱 Eco Fashion Hub
- **Email:** `admin@ecofashionhub.com`
- **Password:** `admin123`
- **Focus:** Sustainable and eco-friendly thrift clothing
- **Commission:** 4%

### 3. 🕺 Retro Style Co
- **Email:** `admin@retrostyleco.com`
- **Password:** `admin123`
- **Focus:** Curated retro and vintage fashion pieces
- **Commission:** 6%

## 🔗 Access Points

- **Customer Store:** http://localhost:3000
- **Admin Panel:** http://localhost:8080
- **Backend API:** http://localhost:5001

## 📊 Features

### Admin Panel Features (Per Company)
- **Dashboard:** Company-specific analytics and stats
- **Product Management:** Add, edit, delete company products only
- **Order Management:** View and manage orders for company products
- **User Management:** View all marketplace users (shared)
- **Theme Settings:** Customize the marketplace appearance
- **Company Info:** Display company details and commission rates

### Customer Features
- **Unified Catalog:** Browse products from all companies
- **Company Attribution:** See which company each product is from
- **Multi-Company Orders:** Buy from multiple companies in one order
- **Wishlist & Cart:** Standard e-commerce features
- **User Profiles:** Manage personal information and order history

## 🛠 Technical Implementation

### Database Schema
- **companies:** Store company information
- **products:** Linked to companies via `company_id`
- **orders:** Linked to companies via `company_id`
- **users:** Shared across all companies (marketplace users)
- **admins:** Linked to companies via `admin_company_id`

### API Routes
- **Public Routes:** Show products from all companies
- **Admin Routes:** Filter data by admin's company
- **Company-Specific:** Dashboard, products, orders filtered by company

### Security
- Admins can only access their company's data
- Cross-company data access is prevented
- Users can browse all companies' products

## 🎯 Business Model

This marketplace operates on a **commission-based model**:
- Each company pays a commission on sales (configurable per company)
- Companies manage their own inventory and pricing
- Marketplace handles payments, user management, and platform features
- Revenue sharing between marketplace and companies

## 🔄 Data Flow

1. **Product Creation:** Company admin adds product → Stored with company_id
2. **Customer Browsing:** Customer sees all products from all companies
3. **Order Placement:** Order created with company_id based on products
4. **Order Management:** Each company sees only their orders
5. **Analytics:** Each company sees only their performance data

## 📈 Scaling

The system is designed to easily add new companies:
1. Create company record in database
2. Create admin user linked to company
3. Company can immediately start adding products
4. Products appear in customer store automatically

## 🎨 Customization

- **Themes:** Each company can customize the marketplace appearance
- **Branding:** Company information displayed on products
- **Commission Rates:** Configurable per company
- **Product Categories:** Shared across all companies

This multi-company marketplace provides a scalable solution for multiple thrift clothing businesses to operate under one platform while maintaining their individual identity and business operations.