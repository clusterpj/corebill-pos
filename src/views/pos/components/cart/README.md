# Cart Components Documentation

## Overview
The cart functionality is implemented through a set of modular components and composables that handle cart operations, item management, and order processing in the CorePOS system.

## Directory Structure
```
cart/
├── CartItemList.vue       # Cart items display and management
├── CartSummary.vue       # Order totals and calculations
├── EditItemDialog.vue    # Item editing dialog
├── OrderNotes.vue        # Order notes management
├── README.md
└── composables/
    └── useCart.js        # Cart operations logic
```

## Components

### CartItemList.vue
Displays and manages cart items.

**Features:**
- Item quantity management
- Item removal
- Item editing
- Price display
- Quantity validation

**Events:**
- `edit`: Triggered when editing an item
- `remove`: Triggered when removing an item
- `update-quantity`: Triggered when changing item quantity

### CartSummary.vue
Displays order totals and calculations.

**Props:**
- `subtotal`: Order subtotal
- `discountAmount`: Applied discount
- `taxRate`: Current tax rate
- `taxAmount`: Calculated tax
- `total`: Final order total

**Features:**
- Dynamic calculations
- Formatted currency display
- Tax calculations
- Discount display

### EditItemDialog.vue
Modal dialog for editing cart items.

**Props:**
- `modelValue`: Controls dialog visibility
- `item`: Item being edited
- `index`: Item's position in cart

**Events:**
- `update:modelValue`: Dialog visibility changes
- `save`: Item modifications saved

### OrderNotes.vue
Manages order notes and descriptions.

**Features:**
- Note entry and editing
- Character limit validation
- Auto-save functionality
- Hold order descriptions

## Composables

### useCart.js
Centralizes cart operations logic.

**Features:**
```typescript
interface CartOperations {
  cartStore: CartStore;
  updating: Ref<boolean>;
  clearOrder: () => void;
  updateQuantity: (itemId: string, quantity: number, index?: number) => void;
  removeItem: (itemId: string, index?: number) => void;
  updateOrder: () => Promise<void>;
}
```

**Key Operations:**
- Cart clearing
- Quantity updates
- Item removal
- Order updates
- Hold order management

## State Management

### Cart Store Integration
- Uses Pinia cart store
- Maintains reactive state
- Handles mutations
- Manages cart calculations

### Local State
- Dialog visibility
- Form states
- Loading indicators
- Error messages

## Implementation Details

### Cart Operations
```typescript
// Clear cart
const clearOrder = () => cartStore.clearCart()

// Update item quantity
const updateQuantity = (itemId, quantity, index) => {
  cartStore.updateItemQuantity(itemId, quantity, index)
}

// Remove item
const removeItem = (itemId, index) => {
  cartStore.removeItem(itemId, index)
}
```

### Hold Order Management
```typescript
// Update hold order
const updateOrder = async () => {
  if (!cartStore.holdOrderDescription) {
    throw new Error('No order description')
  }
  
  const orderData = cartStore.prepareHoldInvoiceData(
    store,
    cashier,
    description
  )
  
  await posStore.updateHoldInvoice(description, orderData)
}
```

## Error Handling

### Validation
- Quantity limits
- Required fields
- Data type validation
- API response validation

### Error Messages
- User-friendly notifications
- Detailed error logging
- Error state management
- Recovery options

## Performance Optimizations

### Rendering
- Computed properties
- Reactive refs
- Efficient updates
- Lazy loading

### State Updates
- Batched mutations
- Optimized calculations
- Debounced inputs
- Memory management

## Mobile & Tablet Support

### Responsive Design
- Flexible layouts
- Touch targets
- Swipe actions
- Keyboard handling

### Performance
- Optimized rendering
- Efficient scrolling
- Memory management
- Touch event handling

## Testing Strategy

### Unit Tests
- Component rendering
- Event handling
- Computed properties
- Validation logic

### Integration Tests
- Cart operations
- Store interactions
- API calls
- Error scenarios

### E2E Tests
- User workflows
- Cart management
- Order processing
- Payment flows

## Future Improvements

### Features
- Bulk operations
- Drag-and-drop reordering
- Advanced search
- Item suggestions

### Technical
- TypeScript migration
- Performance optimizations
- Enhanced error handling
- Offline support

### UX/UI
- Enhanced animations
- Keyboard shortcuts
- Accessibility improvements
- Touch gestures

## Dependencies
- Vue 3
- Vuetify 3
- Pinia
- Logger utility
- Cart store
- POS store
