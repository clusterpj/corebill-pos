# CorePOS Developer Documentation

## 1. System Architecture Overview

### Technologies and Frameworks
- **Frontend Framework**: Vue 3 (Composition API)
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Build Tool**: Vite
- **Type System**: TypeScript
- **Testing**: Vitest

### System Requirements
- Node.js 16+ 
- npm 8+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Development Environment Setup

#### Prerequisites
1. Install Node.js (16+ recommended)
2. Install npm
3. Clone the repository
   ```bash
   git clone https://github.com/your-org/core-pos.git
   cd core-pos
   ```

#### Installation Steps
1. Install dependencies
   ```bash
   npm install
   ```

2. Set up environment variables
   - Copy `.env.development` to `.env`
   - Update configuration as needed

3. Run development server
   ```bash
   npm run dev
   ```

4. Run tests
   ```bash
   npm run test
   ```

## 2. Core Components Documentation

### Project Structure
```
src/
├── assets/           # Static assets
├── components/       # Reusable Vue components
├── composables/      # Composition API logic
├── plugins/         # Vue and third-party plugins
├── router/          # Vue Router configuration
├── services/        # API and external service integrations
├── stores/          # Pinia store definitions
├── styles/          # Global styles and design tokens
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
└── views/           # Page-level components
```

### State Management Architecture

#### Cart Store (`src/stores/cart-store.js`)
The cart store manages the shopping cart state and operations.

```javascript
// State Structure
{
  items: [],              // Cart items
  discountType: 'fixed',  // Discount type (fixed/percentage)
  discountValue: 0,       // Discount amount
  taxRate: 0.08,         // Tax rate (8%)
  notes: '',             // Order notes
  selectedTables: [],    // Selected tables for dine-in
  holdInvoiceId: null,   // ID for held orders
  holdOrderDescription: null // Description for held orders
}

// Key Actions
- addItem(product, quantity)
- updateItemQuantity(itemId, quantity, index)
- removeItem(itemId, index)
- setDiscount(type, value)
- clearCart()
```

#### Order Type Management (`src/views/pos/composables/useOrderType.js`)
Handles different types of orders and their specific requirements.

```javascript
// Order Types
const ORDER_TYPES = {
  DINE_IN: 'DINE_IN',
  TO_GO: 'TO_GO',
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP'
}

// Customer Information Structure
{
  name: string,
  phone: string,
  address: string,     // Required for delivery
  pickupTime: string,  // Required for pickup
  instructions: string
}
```

### Invoice Processing System

#### Invoice Data Structure
```javascript
{
  print_pdf: boolean,
  is_invoice_pos: number,
  is_pdf_pos: boolean,
  invoice_date: string,
  due_date: string,
  invoice_number: string,
  user_id: number,
  total: number,
  sub_total: number,
  tax: number,
  discount_type: string,
  discount: string,
  items: Array<InvoiceItem>,
  notes: string,
  status: string,
  paid_status: string
}
```

#### Hold Order System
- Supports temporary order storage
- Converts to regular invoices
- Maintains order type information
- Handles customer details

## 3. Implementation Workflows

### Order Processing Workflow

1. **Cart Management**
   ```javascript
   // Adding items
   cartStore.addItem(product, quantity)
   
   // Updating quantities
   cartStore.updateItemQuantity(itemId, newQuantity)
   
   // Applying discounts
   cartStore.setDiscount('fixed', 10.00)
   ```

2. **Order Type Selection**
   ```javascript
   const { setOrderType, setCustomerInfo } = useOrderType()
   
   // Set order type
   setOrderType(ORDER_TYPES.DELIVERY)
   
   // Set customer information
   setCustomerInfo({
     name: 'John Doe',
     phone: '555-0123',
     address: '123 Main St'
   })
   ```

3. **Invoice Creation**
   ```javascript
   // Prepare invoice data
   const invoiceData = cartStore.prepareInvoiceData(
     storeId,
     cashRegisterId,
     referenceNumber
   )
   
   // Create invoice
   const result = await posOperations.createInvoice(invoiceData)
   ```

### Error Handling Patterns

```javascript
try {
  const result = await processOrder()
  if (!result.success) {
    throw new Error(result.message)
  }
  // Handle success
} catch (error) {
  logger.error('Order processing failed:', error)
  // Handle error state
} finally {
  // Clean up
}
```

## 4. Development Guidelines

### State Management Best Practices

1. **Store Organization**
   - Separate state, actions, and getters
   - Use composables for complex logic
   - Implement proper error handling

2. **Component Integration**
   ```javascript
   // In Vue components
   import { useCartStore } from '@/stores/cart-store'
   import { useOrderType } from '@/composables/useOrderType'
   
   const cartStore = useCartStore()
   const { processOrder, setOrderType } = useOrderType()
   ```

3. **Type Safety**
   ```typescript
   // Type definitions (src/types/order.ts)
   interface OrderItem {
     id: number
     name: string
     price: number
     quantity: number
     total: number
   }
   ```

### Testing Requirements

1. **Unit Tests**
   ```javascript
   describe('Cart Store', () => {
     it('should add items correctly', () => {
       const store = useCartStore()
       store.addItem({ id: 1, price: 10 }, 2)
       expect(store.items).toHaveLength(1)
       expect(store.items[0].quantity).toBe(2)
     })
   })
   ```

2. **Component Tests**
   ```javascript
   describe('OrderTypeSelection', () => {
     it('should validate delivery information', async () => {
       const { isValid } = useOrderType()
       setOrderType(ORDER_TYPES.DELIVERY)
       expect(isValid.value).toBe(false)
       // Add required information
       setCustomerInfo({
         name: 'John',
         phone: '555-0123',
         address: '123 Main St'
       })
       expect(isValid.value).toBe(true)
     })
   })
   ```

## 5. Security Best Practices

1. **Input Validation**
   ```javascript
   // Validate customer information
   const validateCustomerInfo = (info) => {
     if (!info.name?.trim()) throw new Error('Name is required')
     if (!info.phone?.trim()) throw new Error('Phone is required')
     if (orderType === 'DELIVERY' && !info.address?.trim()) {
       throw new Error('Address is required for delivery')
     }
   }
   ```

2. **Error Handling**
   ```javascript
   // Centralized error handling
   const handleApiError = (error) => {
     logger.error('API Error:', error)
     if (error.response?.status === 401) {
       // Handle authentication error
     }
     throw error
   }
   ```

## 6. Performance Considerations

1. **State Management**
   - Use computed properties for derived state
   - Implement proper caching strategies
   - Optimize store subscriptions

2. **Component Optimization**
   ```javascript
   // Use v-show for frequently toggled components
   <v-dialog v-show="showDialog">
   
   // Use v-if for rarely toggled components
   <complex-component v-if="shouldRender">
   ```

## 7. Troubleshooting Guide

### Common Issues

1. **Order Processing Failures**
   - Check network connectivity
   - Verify customer information
   - Validate cart contents
   - Check store and cashier IDs

2. **State Management Issues**
   - Clear cart and retry
   - Check for store initialization
   - Verify customer session

### Debugging Tools

1. **Logger Usage**
   ```javascript
   import { logger } from '@/utils/logger'
   
   logger.debug('Debug information')
   logger.info('Operation completed')
   logger.error('Error occurred:', error)
   ```

2. **State Inspection**
   ```javascript
   // Use Vue DevTools to inspect:
   - Pinia store state
   - Component props and state
   - Event emissions
   ```

## 8. Feature Development Guide

### Adding New Features

1. **Plan Implementation**
   - Define requirements
   - Design component structure
   - Plan state management
   - Consider error cases

2. **Implementation Steps**
   ```javascript
   // 1. Add types
   interface NewFeatureData {
     // ...
   }
   
   // 2. Add store module
   const useNewFeatureStore = defineStore('newFeature', {
     // ...
   })
   
   // 3. Create composable
   function useNewFeature() {
     // ...
   }
   
   // 4. Implement components
   const NewFeatureComponent = defineComponent({
     // ...
   })
   ```

3. **Testing Requirements**
   - Unit tests for store logic
   - Component tests for UI
   - Integration tests for workflows
   - Error case coverage

### Documentation Requirements

1. **Code Documentation**
   ```javascript
   /**
    * Processes an order with the given type and customer information
    * @param {OrderType} type - The type of order
    * @param {CustomerInfo} customerInfo - Customer details
    * @returns {Promise<OrderResult>} The processing result
    */
   ```

2. **Update Guides**
   - Add new feature documentation
   - Update workflow diagrams
   - Document API changes
   - Update troubleshooting guide
