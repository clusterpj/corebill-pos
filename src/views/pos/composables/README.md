# CorePOS Composables Documentation

## Overview
The composables directory contains reusable Vue 3 composition functions that encapsulate complex business logic for the POS system. These composables provide a modular and maintainable approach to managing state and behavior.

## Composables

### 1. useCartDiscount
Manages cart discount calculations and application.

```typescript
interface CartDiscount {
  discountType: Ref<string>;
  discountValue: Ref<number>;
  updateDiscount: () => void;
}
```

**Key Features:**
- Reactive discount state management
- Type conversion for API compatibility
- Automatic store synchronization

### 2. useCashierSelection
Handles cashier initialization and selection process.

```typescript
interface CashierSelection {
  showSelectionDialog: Ref<boolean>;
  selectedCashier: Ref<string | null>;
  cashierError: Ref<string>;
  isReadyToContinue: ComputedRef<boolean>;
  handleCashierChange: (cashierId: string) => Promise<void>;
  initializeSelection: () => Promise<void>;
}
```

**Key Features:**
- Dialog state management
- Error handling
- Store configuration checks

### 3. useErrorHandling
Provides centralized error management.

```typescript
interface ErrorHandling {
  error: Ref<string | null>;
  loading: Ref<boolean>;
  handleError: (err: Error, context?: string) => string;
  clearError: () => void;
}
```

**Key Features:**
- Centralized error state
- Loading state management
- Automatic error clearing

### 4. useOrderManagement
Manages order creation and processing workflows.

```typescript
interface OrderManagement {
  showReferenceDialog: Ref<boolean>;
  error: Ref<string | null>;
  confirmHoldOrder: (referenceNumber: string) => Promise<void>;
  printOrder: (orderId?: string) => Promise<void>;
  submitOrder: () => void;
}
```

**Key Features:**
- Hold order creation
- Order printing
- Reference number management

### 5. useOrderType
Supports different order types and their specific requirements.

```typescript
interface OrderType {
  orderType: Ref<string | null>;
  customerInfo: Ref<CustomerInfo>;
  isValid: ComputedRef<boolean>;
  processOrder: () => Promise<OrderResult>;
  // ... additional properties
}
```

**Key Features:**
- Order type validation
- Customer information management
- Order processing logic

### 6. usePayment
Handles payment processing and method management.

```typescript
interface Payment {
  paymentMethods: Ref<PaymentMethod[]>;
  createPayment: (invoice: Invoice, payments: Payment[]) => Promise<void>;
  calculateFees: (methodId: number, amount: number) => number;
  // ... additional properties
}
```

**Key Features:**
- Payment method management
- Fee calculation
- Payment validation

### 7. useTableAssignment
Manages table selection and assignment.

```typescript
interface TableAssignment {
  tables: Ref<Table[]>;
  selectedTables: ComputedRef<SelectedTable[]>;
  loadTables: () => Promise<void>;
  addTable: (tableId: number, quantity?: number) => void;
  // ... additional properties
}
```

**Key Features:**
- Table state management
- Quantity tracking
- API data formatting

## Integration Patterns

### Store Integration
- Uses Pinia stores
- Maintains reactivity
- Handles store synchronization

### API Integration
- Consistent error handling
- Response transformation
- Request formatting

### Component Integration
- Props and events
- Reactive state
- Computed properties

## Best Practices

### State Management
- Use `ref` and `reactive` appropriately
- Maintain single source of truth
- Handle side effects properly

### Error Handling
- Consistent error patterns
- Detailed error messages
- Error state management

### Performance
- Minimize computations
- Use computed properties
- Implement proper cleanup

## Testing Strategy

### Unit Tests
- Test individual composables
- Mock dependencies
- Verify state changes

### Integration Tests
- Test store interactions
- Verify API calls
- Test error scenarios

## Security Considerations
- Input validation
- Data sanitization
- Proper error exposure

## Future Improvements
- Enhanced TypeScript support
- More comprehensive testing
- Performance optimizations
- Additional composables for common patterns

## Dependencies
- Vue 3 Composition API
- Pinia
- Logger utility
- POS API services

## Development Guidelines
- Follow composition API patterns
- Document complex logic
- Maintain type safety
- Implement proper cleanup
