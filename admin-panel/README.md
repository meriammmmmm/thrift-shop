# Thrift Shop Admin Panel

A comprehensive admin panel for managing the Thrift Shop application. Built with vanilla HTML, CSS (Tailwind), and JavaScript.

## 🚀 Features

### 📊 Dashboard
- **Real-time Analytics**: View total users, products, orders, and revenue
- **Interactive Charts**: Sales overview and top categories visualization
- **Key Metrics**: Weekly growth indicators and performance stats

### 👥 Users & Purchases Management
- **User Overview**: View all registered users with their details
- **Purchase History**: Detailed view of each user's orders and spending
- **User Analytics**: Total orders and spending per user
- **Order Tracking**: Monitor user purchase patterns

### ➕ Add Articles (Products)
- **Product Creation**: Add new products with complete details
- **Image Management**: Support for multiple product images
- **Category Management**: Organize products by categories
- **Inventory Control**: Set stock status and pricing

### 📦 Product Management
- **Product Listing**: View all products with status indicators
- **Edit Products**: Modify existing product details
- **Delete Products**: Remove products from inventory
- **Stock Management**: Track in-stock vs sold-out items

### 🛒 Orders Management
- **Order Overview**: View all customer orders
- **Status Updates**: Change order status (Pending → Delivered)
- **Customer Details**: See who placed each order
- **Order Tracking**: Monitor order fulfillment process

## 🔧 Setup & Installation

### Prerequisites
- Node.js (for live-server)
- Backend API running on http://localhost:5001

### Installation
```bash
cd admin-panel
npm install
```

### Development
```bash
npm run dev
```
This will start a live server on http://localhost:3001

### Production
```bash
npm run build
```

## 🔐 Authentication

### Admin Credentials
- **Email**: admin@thriftshop.com
- **Password**: admin123

### Security Features
- JWT token authentication
- Admin role verification
- Secure API communication
- Session management

## 📱 Usage

### 1. Login
- Open http://localhost:3001
- Use admin credentials to login
- Dashboard will load automatically

### 2. View Users & Purchases
- Click "Users & Purchases" in sidebar
- View all registered users
- Click "View" to see user's purchase history
- Monitor user spending and order patterns

### 3. Add New Articles
- Click "Add Articles" in sidebar
- Fill in product details:
  - Name, Brand, Price
  - Category, Size, Condition
  - Description and Images
  - Material and Seller info
- Click "Add Product" to save

### 4. Manage Products
- Click "Manage Products" in sidebar
- View all products with status
- Edit or delete existing products
- Monitor inventory levels

### 5. Manage Orders
- Click "Orders" in sidebar
- View all customer orders
- Update order status using dropdown
- Track order fulfillment

## 🎨 Interface Features

### Responsive Design
- Mobile-friendly interface
- Tablet and desktop optimized
- Clean, modern UI with Tailwind CSS

### Interactive Elements
- Real-time data updates
- Modal windows for detailed views
- Form validation and feedback
- Loading states and error handling

### Navigation
- Sidebar navigation
- Active section highlighting
- Breadcrumb navigation
- Quick access buttons

## 🔌 API Integration

### Backend Connection
- Connects to Express.js backend on port 5001
- RESTful API communication
- JWT token authentication
- Error handling and retry logic

### Supported Endpoints
- `POST /api/auth/login` - Admin authentication
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/users` - User management
- `GET /api/admin/orders` - Order management
- `POST /api/products` - Add products
- `DELETE /api/products/:id` - Delete products

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total users count
- Total products in inventory
- Total orders processed
- Total revenue generated

### Visual Charts
- Sales trend over time (Line chart)
- Top product categories (Doughnut chart)
- Order status distribution
- User registration trends

### Real-time Updates
- Live data refresh
- Automatic chart updates
- Real-time notifications
- Dynamic status changes

## 🛠️ Customization

### Adding New Features
1. Add new section in HTML
2. Create corresponding JavaScript functions
3. Add navigation link
4. Implement API calls

### Styling
- Uses Tailwind CSS for styling
- Font Awesome for icons
- Chart.js for data visualization
- Responsive grid layouts

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Build the application
2. Deploy to web server
3. Update API_BASE_URL in admin.js
4. Configure CORS on backend

### Environment Variables
- Update `API_BASE_URL` in admin.js
- Configure backend URL
- Set up authentication endpoints

## 📝 File Structure

```
admin-panel/
├── index.html          # Main HTML file
├── js/
│   └── admin.js        # JavaScript functionality
├── package.json        # Dependencies
└── README.md          # Documentation
```

## 🔍 Troubleshooting

### Common Issues
1. **Login fails**: Check if backend is running on port 5001
2. **Data not loading**: Verify API endpoints and authentication
3. **Charts not showing**: Ensure Chart.js is loaded properly
4. **Styling issues**: Check Tailwind CSS CDN connection

### Debug Mode
- Open browser developer tools
- Check console for error messages
- Verify network requests in Network tab
- Check localStorage for authentication tokens

## 🎯 Future Enhancements

### Planned Features
- Product image upload
- Bulk product import/export
- Advanced analytics and reporting
- Email notifications
- Inventory alerts
- Customer communication tools

### Technical Improvements
- TypeScript conversion
- Progressive Web App (PWA)
- Offline functionality
- Advanced caching
- Real-time notifications
- Multi-language support