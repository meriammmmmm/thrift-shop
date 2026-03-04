# Inventory Management Update - RESERVED Status

## New System

Products now have THREE states:
1. **AVAILABLE** - Product is available for purchase
2. **RESERVED** - Product is in an active order (CONFIRMED/PROCESSING/SHIPPED)
3. **SOLD** - Product has been delivered (order status: DELIVERED)

## How It Works

### Order Flow

1. **Order Created (CONFIRMED)**
   - Product status: `reservation_status = 'reserved'`
   - Product visibility: `in_stock = 1` (still visible but shows "RESERVED")
   - Badge shown: "RESERVED"

2. **Order Processing/Shipped**
   - Product status: `reservation_status = 'reserved'`
   - Product visibility: `in_stock = 1`
   - Badge shown: "RESERVED"

3. **Order Delivered**
   - Product status: `reservation_status = 'sold'`
   - Product visibility: `in_stock = 0`
   - Badge shown: "SOLD OUT"

4. **Order Cancelled**
   - Product status: `reservation_status = 'available'`
   - Product visibility: `in_stock = 1`
   - Badge shown: None (available for purchase)

## Database Changes

Added two new columns to `products` table:
- `reservation_status` TEXT DEFAULT 'available' - Values: 'available', 'reserved', 'sold'
- `reserved_by_order_id` INTEGER - Links to the order that reserved this product

## Frontend Display

Products now return:
```json
{
  "id": 17,
  "name": "Product Name",
  "in_stock": true,
  "reservation_status": "reserved",
  "reserved_by_order_id": 123
}
```

Display logic:
- `reservation_status === 'available'` → Show "Add to Bag" button
- `reservation_status === 'reserved'` → Show "RESERVED" badge
- `reservation_status === 'sold'` or `in_stock === false` → Show "SOLD OUT" badge

## API Endpoints

### Order Status Changes

All handled automatically when order status changes:

**PATCH /api/orders/:id/status**
```json
{ "status": "DELIVERED" }
```
- CANCELLED/REFUNDED → Products become available
- CONFIRMED/PROCESSING/SHIPPED → Products stay reserved
- DELIVERED → Products marked as sold

**POST /api/orders/:id/cancel**
- Makes products available again

**POST /api/orders/:id/deliver**
- Marks products as sold

## Benefits

- Clear distinction between reserved and sold items
- Customers can see which items are temporarily unavailable vs permanently sold
- Better inventory tracking
- Prevents confusion about product availability
- Items only marked as sold when actually delivered
