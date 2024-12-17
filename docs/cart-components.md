# Cart Components Documentation

## Overview

The cart functionality has been refactored to improve modularity and maintainability while preserving all existing functionality. The refactoring splits the original PosCart component into three main parts:

1. `PosCart.vue` - Main container component
2. `EditItemDialog.vue` - Extracted dialog component for item editing
3. `composables/useCart.js` - Reusable cart operations logic

## Component Structure

```
cart/
├── README.md
├── CartItemList.vue
├── CartSummary.vue
├── EditItemDialog.vue
├── PosCart.vue
└── composables/
    └── useCart.js
```

## Components

### PosCart.vue

The main container component that orchestrates cart functionality.

#### Key Features
- Displays current order status
- Manages held orders
- Shows cart items and summary
- Handles loading states

#### Usage Example
```vue
<template>
  <pos-cart />
</template>

<script setup>
import PosCart from './components/PosCart.vue'
</script>
```

### EditItemDialog.vue

A reusable dialog component for editing cart items.

#### Props
- `modelValue` (Boolean): Controls dialog visibility
- `item` (Object): The item being edited
- `index` (Number): Item's index in the cart

#### Events
- `update:modelValue`: Emitted when dialog visibility changes

#### Usage Example
```vue
<template>
  <edit-item-dialog
    v-model="showDialog"
    :item="currentItem"
    :index="itemIndex"
  />
</template>
```

## Composables

### useCart.js

A composable that encapsulates cart operations and state management.

#### Features
- Cart operations (clear, update quantity, remove items)
- Hold order management
- Update functionality for held orders

#### Available Methods
- `clearOrder()`: Clears the current cart
- `updateQuantity(itemId, quantity, index)`: Updates item quantity
- `removeItem(itemId, index)`: Removes an item from cart
- `updateOrder()`: Updates a held order

#### Usage Example
```vue
<script setup>
import { useCart } from './composables/useCart'

const { 
  cartStore,
  updating,
  clearOrder,
  updateQuantity,
  removeItem,
  updateOrder
} = useCart()
</script>
```

## Implementation Details

### Update Function

The update functionality is preserved exactly as in the original implementation to maintain compatibility and prevent regressions. This function:

1. Validates order description
2. Prepares order data
3. Sends update request
4. Handles success/failure cases
5. Manages loading states

```javascript
const updateOrder = async () => {
  try {
    const description = cartStore.holdOrderDescription
    if (!description) {
      throw new Error('No order description found')
    }

    updating.value = true
    logger.debug('Updating order with description:', description)

    const orderData = cartStore.prepareHoldInvoiceData(
      posStore.selectedStore,
      posStore.selectedCashier,
      description
    )

    const response = await posStore.updateHoldInvoice(description, orderData)

    if (response.success) {
      window.toastr?.['success']('Order updated successfully')
      cartStore.setHoldInvoiceId(null)
      cartStore.clearCart()
    } else {
      throw new Error(response.message || 'Failed to update order')
    }
  } catch (error) {
    logger.error('Failed to update order:', error)
    window.toastr?.['error'](error.message || 'Failed to update order')
  } finally {
    updating.value = false
  }
}
```

### State Management

The cart state is managed through the Pinia store (`useCartStore`), which remains unchanged to maintain backwards compatibility. The composable pattern wraps store operations to provide a cleaner API while preserving all functionality.

### Error Handling

Error handling is implemented at multiple levels:
1. Component level - UI feedback for user actions
2. Composable level - Operation-specific error handling
3. Store level - State management errors

### Mobile & Tablet Optimizations

The components include responsive design optimizations:
- Sticky headers and footers
- Appropriate spacing and layouts
- Touch-friendly interaction areas

## Important Considerations

1. **Backwards Compatibility**
   - No changes to external API
   - Existing imports continue to work
   - Same event handling patterns

2. **State Management**
   - Cart store remains single source of truth
   - Composable provides convenient access
   - State mutations follow existing patterns

3. **Error Handling**
   - Comprehensive error catching
   - User-friendly error messages
   - Proper error logging

4. **Performance**
   - Efficient state updates
   - Optimized rendering
   - Proper cleanup in composables

5. **Maintainability**
   - Clear separation of concerns
   - Documented components and functions
   - Consistent code style

## Future Improvements

While maintaining backwards compatibility, future improvements could include:
1. Enhanced type safety with TypeScript
2. Unit tests for composables
3. E2E tests for critical paths
4. Performance optimizations for large orders
5. Additional cart features (e.g., bulk operations)
