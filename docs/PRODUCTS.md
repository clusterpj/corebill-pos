# Products and Sections Documentation

## Overview
This document describes the product management implementation in the CoreBill POS system, including product fetching, cart integration, and section handling.

## Current Implementation

### Key Components
1. **Product Management API (pos-api.js)**
   - `getItems()` - Fetches products with optional filters
   - `createItem()` - Creates new products
   - `updateItem()` - Updates existing products
   - `getItemCategories()` - Gets product categories

2. **Cart Management**
   - `cart-store.js` - Main Pinia store managing cart state and actions
   - `cartSync.ts` - Handles cart persistence and synchronization across browser tabs

### Product Type Definition
```typescript
export interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  description?: string
  price: number
  cost_price?: number
  tax_rate: number
  category_id: number
  stock_level: number
  reorder_level?: number
  status: 'active' | 'inactive'
  attributes?: Record<string, any>
  
  // Section related fields
  section_id?: number
  section?: Section
  section_type?: 'kitchen' | 'bar' | 'other'
  section_name?: string
}
```

### Data Flow
1. Products are fetched via `posApi.getItems()` and displayed in the UI
2. When a product is added to cart:
   - `cartStore.addItem()` is called
   - Delegates to store actions
   - Cart state is saved via `cartSync.saveCartState()`
   - Changes are broadcast to other tabs via BroadcastChannel

### Cart State Structure
```typescript
interface CartState {
  items: any[] // Needs proper typing
  discountType?: string
  discountValue?: number
  taxRate?: number
  total?: number
  subtotal?: number
  notes?: string
  type?: OrderType
  holdInvoiceId?: number | null
  holdOrderDescription?: string | null
  selectedTables?: number[]
  timestamp?: number
}
```

## Identified Areas for Improvement

### Missing Type Definitions
1. **CartItem Interface** - Proper typing for cart items
2. **ProductCategory Interface** - Detailed category structure
3. **ProductFilters Interface** - Type-safe filtering parameters
4. **ProductCreate/Update Interfaces** - Validation for create/update operations
5. **Section Interface** - Complete section type definition

### Recommended Improvements
1. **Type Safety**
   - Add proper TypeScript interfaces for all product-related types
   - Implement type guards for API responses
   - Add validation for product data before adding to cart

2. **Error Handling**
   - Add structured error handling for product operations
   - Implement validation middleware for product data
   - Add error boundaries for product components

3. **Cart Management**
   - Add proper typing for cart items
   - Implement cart item validation
   - Add versioning to cart state for compatibility

4. **Performance**
   - Add caching for product data
   - Implement pagination for large product catalogs
   - Add debouncing for product search

## Next Steps
1. Add missing type definitions
2. Implement type-safe product operations
3. Enhance error handling and validation
4. Improve cart state management

Would you like me to propose specific changes for any of these improvements?
