# CorePOS Components Documentation

## Overview
The components directory contains Vue components specific to the Point of Sale (POS) functionality, organized into logical subdirectories for different aspects of the POS system.

## Directory Structure
```
components/
├── HeldOrdersModal.vue          # Modal for managing held orders
├── ItemManagementModal.vue      # Modal for item creation/editing
├── PosCart.vue                  # Cart display and management
├── PosFooter.vue               # Footer actions and payment
├── PosProducts.vue             # Product display and selection
├── cart/                       # Cart-related components
├── dialogs/                    # Modal dialogs
├── held-orders/               # Held orders management
├── kitchen/                   # Kitchen display components
├── order-types/               # Order type components
├── products/                  # Product display components
└── tables/                    # Table management components
```

## Core Components

### 1. PosCart (`PosCart.vue`)
Main cart interface component.

**Features:**
- Cart item display
- Item quantity management
- Order notes
- Cart summary
- Hold order support

**Dependencies:**
- CartStore
- Cart composables
- Cart subcomponents

### 2. PosProducts (`PosProducts.vue`)
Product browsing and selection interface.

**Features:**
- Product grid display
- Category filtering
- Search functionality
- Grid layout settings
- Quick add to cart

**State Management:**
- Local grid settings persistence
- POS store integration
- Cart store integration

### 3. PosFooter (`PosFooter.vue`)
Order processing and action controls.

**Features:**
- Order type selection
- Payment processing
- Print functionality
- Hold order management

**Store Integration:**
- Cart Store
- Company Store
- POS Store

### 4. ItemManagementModal (`ItemManagementModal.vue`)
Item creation and editing interface.

**Features:**
- Form validation
- Image upload
- Category selection
- Store association

**API Integration:**
- Item creation/update
- Image upload handling
- Store validation

## Subdirectories

### Cart Components (`cart/`)
- CartItemList
- CartSummary
- EditItemDialog
- OrderNotes

### Dialog Components (`dialogs/`)
- PaymentDialog
- ReferenceDialog
- OrderTypeDialog

### Held Orders (`held-orders/`)
- HeldOrdersModal
- HeldOrdersTable
- DeleteConfirmationDialog

### Order Types (`order-types/`)
- DineInModal
- ToGoModal
- DeliveryModal
- PickupModal

### Products (`products/`)
- ProductGrid
- CategoryTabs
- ProductSearch
- GridSettings

## State Management

### Store Integration
- Cart Store: Cart state and operations
- POS Store: Product and category management
- Company Store: Store and cashier management

### Local State
- Form state
- UI state
- Temporary data

## Best Practices

### Performance
- Lazy loading of components
- Efficient re-rendering
- Local state optimization
- Image optimization

### Error Handling
- Form validation
- API error handling
- User feedback
- Error logging

### Accessibility
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

## Testing Strategy

### Unit Tests
- Component rendering
- Event handling
- Computed properties
- Method functionality

### Integration Tests
- Store interactions
- API calls
- Component communication

### E2E Tests
- Critical user flows
- Payment processing
- Order management

## Future Improvements
- Enhanced TypeScript support
- Component splitting
- Performance optimization
- Offline support
- Real-time updates

## Dependencies
- Vue 3
- Vuetify 3
- Pinia
- Logger utility
- POS API services

## Development Guidelines
- Follow Vue 3 Composition API
- Use TypeScript where possible
- Implement proper validation
- Maintain consistent styling
- Document complex logic
