# Held Orders Module Documentation

## Overview

The Held Orders module has been refactored to improve modularity, maintainability, and testability while preserving existing functionality. The code has been organized into several specialized modules, each handling specific concerns.

## Module Structure

```
held-orders/
├── composables/
│   └── useHeldOrders.js       # Main composable for held orders functionality
├── utils/
│   ├── formatters.js          # Formatting and display utilities
│   ├── validators.js          # Data validation functions
│   └── invoiceConverter.js    # Invoice conversion logic
└── components/
    ├── HeldOrdersModal.vue    # Main modal component
    ├── HeldOrdersFilters.vue  # Filtering component
    └── HeldOrdersTable.vue    # Orders display component
```

## Core Modules

### 1. useHeldOrders Composable

The main composable that provides held orders functionality.

```javascript
import { useHeldOrders } from './composables/useHeldOrders'

const {
  // State
  loading,
  loadingOrder,
  deletingOrder,
  convertingOrder,
  search,
  selectedType,
  
  // Data
  orderTypes,
  holdInvoices,
  filteredInvoices,
  
  // Actions
  convertToInvoice,
  loadOrder,
  deleteOrder,
  fetchHoldInvoices,
  
  // Utilities
  formatDate,
  formatCurrency,
  getOrderType,
  getOrderTypeColor
} = useHeldOrders()
```

#### Key Features:
- Order management (load, convert, delete)
- State management for loading and processing states
- Filtering and search functionality
- Payment processing integration

### 2. Formatters Module

Utility functions for data formatting and display.

```javascript
import { 
  formatApiDate,
  formatDate,
  formatCurrency,
  toCents,
  getOrderType,
  getOrderTypeColor 
} from '../utils/formatters'

// Format date for API
formatApiDate(new Date()) // Returns: "2024-01-20"

// Format currency
formatCurrency(1234.56) // Returns: "$1,234.56"

// Convert to cents
toCents(12.34) // Returns: 1234
```

### 3. Validators Module

Validation functions for data integrity.

```javascript
import { 
  validateInvoiceData,
  validateInvoiceForConversion 
} from '../utils/validators'

// Validate invoice data
validateInvoiceData({
  invoice_number: "INV-001",
  invoice_date: "2024-01-20",
  items: [...],
  // ... other required fields
})

// Validate before conversion
validateInvoiceForConversion(invoice)
```

### 4. Invoice Converter Module

Handles the complex process of converting held orders to invoices.

```javascript
import { convertHeldOrderToInvoice } from '../utils/invoiceConverter'

// Convert held order to invoice
const result = await convertHeldOrderToInvoice(invoice)
if (result.success) {
  const newInvoice = result.invoice
  // Process the new invoice
}
```

## Implementation Details

### State Management

The module uses Vue's Composition API with refs and computed properties for reactive state management:

```javascript
const loading = ref(false)
const search = ref('')
const selectedType = ref('ALL')

const filteredInvoices = computed(() => {
  let filtered = holdInvoices.value
  
  if (selectedType.value !== 'ALL') {
    filtered = filtered.filter(invoice => 
      getOrderType(invoice) === selectedType.value
    )
  }
  
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice.description?.toLowerCase().includes(searchTerm) ||
      invoice.id?.toString().includes(searchTerm)
    )
  }
  
  return filtered
})
```

### Error Handling

The module implements comprehensive error handling:

```javascript
try {
  // Operation logic
  const result = await operation()
  
  if (!result.success) {
    throw new Error(result.message)
  }
  
  return result
} catch (error) {
  logger.error('Operation failed:', error)
  window.toastr?.['error'](error.message)
  return { success: false, error: error.message }
} finally {
  // Reset loading states
  loading.value = false
}
```

### Integration with Store

The module integrates with Pinia stores for global state management:

```javascript
const posStore = usePosStore()
const cartStore = useCartStore()
const { holdInvoices, holdInvoiceSettings } = storeToRefs(posStore)
```

## Best Practices

1. **State Management**
   - Use refs for mutable state
   - Use computed properties for derived state
   - Maintain single source of truth

2. **Error Handling**
   - Implement try-catch blocks for async operations
   - Provide meaningful error messages
   - Log errors for debugging
   - Show user-friendly notifications

3. **Data Validation**
   - Validate data before API calls
   - Check required fields
   - Validate data types and formats

4. **Code Organization**
   - Separate concerns into modules
   - Keep functions focused and single-purpose
   - Use clear, descriptive naming

## Usage Examples

### Basic Usage

```javascript
import { useHeldOrders } from './composables/useHeldOrders'

export default {
  setup() {
    const {
      loading,
      holdInvoices,
      fetchHoldInvoices,
      loadOrder
    } = useHeldOrders()

    // Fetch orders on mount
    onMounted(fetchHoldInvoices)

    // Load an order
    const handleOrderSelect = async (order) => {
      const success = await loadOrder(order)
      if (success) {
        // Order loaded successfully
      }
    }

    return {
      loading,
      holdInvoices,
      handleOrderSelect
    }
  }
}
```

### Converting Orders

```javascript
const handleConvertOrder = async (order) => {
  const result = await convertToInvoice(order)
  if (result.success) {
    // Invoice created successfully
    // Payment dialog will show automatically
  }
}
```

### Filtering Orders

```javascript
const { search, selectedType, filteredInvoices } = useHeldOrders()

// Update filters
search.value = 'Table 1'
selectedType.value = 'DINE_IN'

// filteredInvoices will automatically update
```

## Considerations

1. **Performance**
   - Computed properties cache results
   - Avoid unnecessary re-renders
   - Optimize large lists with virtual scrolling

2. **Scalability**
   - Modular design allows for easy extensions
   - Clear separation of concerns
   - Reusable utility functions

3. **Maintenance**
   - Well-documented code
   - Consistent error handling
   - Clear function signatures

4. **Testing**
   - Isolated modules are easier to test
   - Pure utility functions
   - Mockable dependencies
