# Cart Store Documentation

## Overview

The cart store is a Pinia store that manages the shopping cart state and operations for the POS system. It has been modularized into separate components for better maintainability and scalability.

## Structure

The cart store is organized into the following modules:

```
src/stores/cart/
├── state.js      # Base state and mutations
├── getters.js    # Computed properties and calculations
├── actions.js    # Cart operations
├── helpers.js    # Utility functions
└── invoice.js    # Invoice preparation logic
```

## Modules

### State (`state.js`)

Contains the base state and simple mutations for the cart.

```javascript
// State structure
{
  items: [],              // Cart items
  discountType: 'fixed',  // Discount type ('fixed' or '%')
  discountValue: 0,       // Discount value
  taxRate: 0.08,         // Tax rate (8%)
  loading: false,        // Loading state
  error: null,          // Error state
  notes: '',           // Order notes
  selectedTables: [],  // Selected tables for dine-in
  holdInvoiceId: null, // Hold invoice ID
  holdOrderDescription: null // Hold order description
}

// Available mutations
setNotes(state, notes)
setSelectedTables(state, tables)
setHoldInvoiceId(state, id)
setHoldOrderDescription(state, description)
setDiscount(state, { type, value })
clearCart(state)
```

### Getters (`getters.js`)

Provides computed properties for cart calculations. All calculations are performed directly from state to avoid dependency issues.

```javascript
// Available getters
subtotal        // Total before discounts and tax
discountAmount  // Calculated discount amount
taxableAmount   // Amount subject to tax
taxAmount       // Calculated tax amount
total           // Final total including tax
itemCount       // Total number of items
isEmpty         // Whether cart is empty
isHoldOrder     // Whether this is a held order
```

### Actions (`actions.js`)

Handles cart operations and item management.

```javascript
// Available actions
addItem(product, quantity = 1)
updateItemQuantity(itemId, quantity, index = null)
removeItem(itemId, index = null)
setDiscount(type, value)
setNotes(notes)
setSelectedTables(tables)
setHoldInvoiceId(id)
setHoldOrderDescription(description)
clearCart()
```

### Helpers (`helpers.js`)

Utility functions for price conversions and data preparation.

```javascript
// Price conversion utilities
priceHelpers.toCents(amount)      // Convert dollars to cents
priceHelpers.toDollars(amount)    // Convert cents to dollars
priceHelpers.normalizePrice(price) // Normalize price to dollars

// API data preparation
prepareItemsForApi(items)         // Format items for API
parseOrderType(notes)             // Extract order type from notes
getCurrentDate()                  // Get current date in ISO format
getDueDate(daysFromNow = 7)      // Get due date in ISO format
```

### Invoice (`invoice.js`)

Handles invoice preparation and formatting.

```javascript
// Available methods
prepareInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber })
prepareHoldInvoiceData(state, getters, { storeId, cashRegisterId, referenceNumber })
```

## Usage Examples

### Basic Cart Operations

```javascript
import { useCartStore } from '@/stores/cart-store'

const cart = useCartStore()

// Add item to cart
cart.addItem({
  id: 1,
  name: 'Product',
  price: 9.99,
  quantity: 1
})

// Update quantity
cart.updateItemQuantity(1, 2)

// Apply discount
cart.setDiscount('%', 10) // 10% discount

// Get total
const total = cart.total
```

### Hold Order Operations

```javascript
// Save order as hold
cart.setHoldInvoiceId('HOLD-123')
cart.setHoldOrderDescription('Customer will return')

// Check if order is held
if (cart.isHoldOrder) {
  // Handle held order
}
```

### Invoice Preparation

```javascript
// Prepare invoice data
const invoiceData = cart.prepareInvoiceData(
  storeId,
  cashRegisterId,
  'INV-001'
)

// Prepare hold invoice
const holdInvoiceData = cart.prepareHoldInvoiceData(
  storeId,
  cashRegisterId,
  'HOLD-001'
)
```

## Implementation Details

### Price Handling

- Prices are stored in dollars but converted to cents for API operations
- The `normalizePrice` helper handles conversion of prices > 100 from cents to dollars
- All calculations are rounded to 2 decimal places

### Tax Calculation

- Tax is calculated on the post-discount amount
- Tax rate is configurable (default 8%)
- Tax calculations are performed in getters for real-time updates

### Discount Handling

- Supports both fixed amount and percentage discounts
- Percentage discounts are calculated on the subtotal
- Discount is applied before tax calculation

### State Management

- All state mutations are performed through actions or mutations
- Getters calculate values directly from state to avoid dependency issues
- State is cleared when cart is cleared or order is completed

## Important Considerations

1. **Price Formatting**
   - Always use helper functions for price conversions
   - Be aware of cents vs dollars in different contexts

2. **Order Flow**
   - Hold orders require both ID and description
   - Clear cart after successful order completion

3. **Calculations**
   - All monetary calculations are rounded appropriately
   - Tax calculations follow specific business rules

4. **API Integration**
   - Use prepareItemsForApi for consistent API formatting
   - Handle both regular and hold invoice scenarios

5. **Error Handling**
   - Check for required fields before operations
   - Validate prices and quantities
   - Handle edge cases in calculations
