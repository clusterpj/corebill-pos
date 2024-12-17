# POS Components Documentation

## Recent Refactoring Overview

The POS payment system has been refactored to improve modularity, maintainability, and reusability while maintaining backward compatibility. The refactoring involved splitting the original PosFooter.vue component into smaller, more focused components and extracting business logic into composables.

### Key Changes

1. **Payment Processing Logic Extraction**
   - Created `usePaymentProcessing` composable
   - Centralized payment-related state and methods
   - Improved separation of concerns

2. **UI Component Separation**
   - Extracted payment dialog into standalone component
   - Simplified PosFooter component
   - Maintained all existing functionality

## Component Documentation

### PosFooter.vue

The main footer component for the POS system, handling order type actions and payment initiation.

```vue
<template>
  <v-footer>
    <!-- Order Type Actions -->
    <div class="d-flex gap-2">
      <held-orders-modal />
      <dine-in-modal />
      <!-- ... other order type modals -->
    </div>

    <!-- Payment Button -->
    <v-btn @click="showPaymentDialog = true">
      Pay {{ formatCurrency(cartStore.total) }}
    </v-btn>

    <payment-details-dialog v-model="showPaymentDialog" />
  </v-footer>
</template>
```

**Key Features:**
- Order type selection
- Payment initiation
- Print order functionality

**Props:** None
**Emits:**
- `print-order`: Triggered when print button is clicked
- `submit-order`: Triggered when order is submitted

### PaymentDetailsDialog.vue

A modal dialog component handling payment processing UI and interactions.

```vue
<template>
  <v-dialog 
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Payment form and summary -->
  </v-dialog>
</template>
```

**Key Features:**
- Order summary display
- Payment method selection
- Amount received input
- Change calculation
- Payment processing

**Props:**
- `modelValue` (Boolean): Controls dialog visibility

**Emits:**
- `update:modelValue`: For v-model binding

## Composables

### usePaymentProcessing

A composable that encapsulates payment processing logic and state management.

```javascript
// Usage example
const {
  isProcessingPayment,
  loadingPaymentMethods,
  paymentMethods,
  selectedPaymentMethod,
  receivedAmount,
  selectedPaymentMethodDetails,
  canProcessPayment,
  loadPaymentMethods,
  handleDenominationClick,
  calculateChange,
  resetPaymentForm,
  processPayment
} = usePaymentProcessing()
```

**Key Functions:**

- `loadPaymentMethods()`: Fetches available payment methods from the API
  ```javascript
  await loadPaymentMethods() // Returns array of payment methods
  ```

- `handleDenominationClick(money)`: Handles denomination selection
  ```javascript
  handleDenominationClick({ amount: '20.00', id: 1 })
  ```

- `calculateChange()`: Calculates change based on received amount
  ```javascript
  calculateChange() // Updates internal state with change amount
  ```

- `processPayment()`: Processes the payment transaction
  ```javascript
  const success = await processPayment()
  if (success) {
    // Payment successful
  }
  ```

**State Management:**
- `isProcessingPayment`: Boolean indicating payment processing state
- `loadingPaymentMethods`: Boolean indicating loading state
- `paymentMethods`: Array of available payment methods
- `selectedPaymentMethod`: Currently selected payment method
- `receivedAmount`: Amount received from customer
- `canProcessPayment`: Computed boolean for payment processing availability

## Implementation Details

### Payment Processing Flow

1. User clicks "Pay" button in PosFooter
2. PaymentDetailsDialog opens
3. Payment methods are loaded automatically
4. User selects payment method and enters amount
5. System calculates change if necessary
6. User confirms payment
7. System processes payment through API
8. On success, cart is cleared and dialog closes

### Error Handling

- API errors are logged and displayed to user via toastr
- Input validation prevents invalid payment processing
- Loading states prevent multiple submissions

### Backward Compatibility

The refactoring maintains full backward compatibility:
- No changes required in parent components
- All existing props and emits preserved
- Same functionality with improved code organization

## Best Practices

1. **State Management**
   - Use composables for complex logic
   - Maintain reactivity with proper Vue 3 patterns
   - Clear separation of concerns

2. **Component Design**
   - Single responsibility principle
   - Props for component configuration
   - Events for parent communication

3. **Error Handling**
   - Comprehensive error catching
   - User-friendly error messages
   - Proper logging for debugging

4. **Performance**
   - Lazy loading of payment methods
   - Computed properties for derived state
   - Efficient reactivity usage

## Usage Examples

### Basic Usage

```vue
<template>
  <pos-footer
    @print-order="handlePrint"
    @submit-order="handleSubmit"
  />
</template>

<script setup>
import PosFooter from './components/PosFooter.vue'

const handlePrint = () => {
  // Handle print order
}

const handleSubmit = () => {
  // Handle submit order
}
</script>
```

### Payment Processing

```vue
<template>
  <payment-details-dialog
    v-model="showPayment"
    @payment-success="handleSuccess"
  />
</template>

<script setup>
import { ref } from 'vue'
import PaymentDetailsDialog from './components/dialogs/PaymentDetailsDialog.vue'
import { usePaymentProcessing } from './composables/usePaymentProcessing'

const showPayment = ref(false)
const { processPayment } = usePaymentProcessing()

const handleSuccess = () => {
  // Handle successful payment
}
</script>
