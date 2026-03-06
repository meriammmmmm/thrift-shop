# Product Display Order Feature

## Overview
Added drag-and-drop functionality to reorder products in the admin panel. Products can now be arranged in a custom order that will be displayed to customers on the storefront.

## Features

### Admin Panel
- **Drag & Drop Reordering**: In the Product Management section, select "Custom Order (Drag & Drop)" from the sort dropdown
- **Visual Feedback**: Rows show a grip icon and cursor changes to indicate draggable items
- **Real-time Updates**: Order is saved automatically when you finish dragging
- **Multiple Sort Options**: Choose between:
  - Custom Order (Drag & Drop) - Your manually arranged order
  - Newest First - Most recently added products
  - Price: Low to High
  - Price: High to Low
  - Brand A-Z
  - Most Popular - Based on likes

### Customer Storefront
- Products are displayed in the custom order set by admins by default
- Customers can still sort by price, brand, popularity, or newest
- Each company's products maintain their own independent ordering

## Database Changes

### New Column
- Added `display_order` (INTEGER) column to the `products` table
- Default value: 0
- Lower numbers appear first

### Migration
Run the initialization script to set initial display order values:

```bash
cd backend
node update-product-order.js
```

This will assign sequential display_order values to existing products based on their creation date within each company.

## API Changes

### New Endpoint
**PUT /api/products/admin/reorder**
- Updates the display order for multiple products
- Requires admin authentication
- Request body:
```json
{
  "productOrders": [
    { "id": 1, "display_order": 0 },
    { "id": 2, "display_order": 1 },
    { "id": 3, "display_order": 2 }
  ]
}
```

### Modified Endpoints
- **GET /api/products** - Now defaults to `sortBy=custom` (display_order)
- **GET /api/products/admin/products** - Now defaults to `sortBy=custom`
- **GET /api/products/company/:companyId** - Now defaults to `sortBy=custom`

All endpoints support the new `sortBy=custom` parameter to use display_order.

## Usage

### For Admins
1. Log into the admin panel
2. Navigate to "Product Management"
3. Select "Custom Order (Drag & Drop)" from the sort dropdown
4. Drag products up or down to reorder them
5. Release to save the new order automatically
6. The order will be reflected on the customer-facing storefront

### For Developers
The display order is stored in the `display_order` column and can be queried:

```sql
SELECT * FROM products 
WHERE company_id = ? 
ORDER BY display_order ASC, created_at DESC
```

## Technical Details

### Frontend (React/TypeScript)
- Component: `admin-panel/src/components/ProductManagement.tsx`
- Uses HTML5 drag-and-drop API
- State management for drag operations
- Automatic API calls on drop

### Backend (Node.js/Express)
- Route: `backend/routes/products.js`
- New endpoint: `/admin/reorder`
- Updated sorting logic in all product list endpoints
- Company-scoped ordering (each company manages their own product order)

### Database
- SQLite with `display_order` column
- Automatic migration on server start
- Indexes on `company_id` and `display_order` for performance

## Notes
- Each company's products have independent ordering
- Admins can only reorder products from their own company
- The custom order is preserved even when products are edited
- New products are added with `display_order = 0` by default
