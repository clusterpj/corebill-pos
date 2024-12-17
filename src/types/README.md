# CorePOS TypeScript Type Definitions

## Overview
This directory contains TypeScript type definitions that provide strong typing and type safety across the CorePOS application. These types ensure consistent data structures, improve code quality, and enhance developer experience.

## Directory Structure
```
types/
├── api.ts           # API response and pagination types
├── common.ts        # Base entity and common interface definitions
├── events.ts        # Application event handling types
├── order.ts         # Order-related type definitions
├── product.ts       # Product and category type definitions
├── sync.ts          # Synchronization operation types
├── user.ts          # User and settings type definitions
└── validation.ts    # Validation rule and result types
```

## Type Definitions

### 1. API Types (`api.ts`)
Provides standardized API response structures.

#### Key Interfaces
- `ApiResponse<T>`: Generic API response
- `PaginatedResponse<T>`: Paginated data response
- `ErrorResponse`: Standardized error structure

**Usage Example:**
```typescript
const response: ApiResponse<User> = {
  data: { id: 1, name: 'John Doe' },
  status: 200,
  message: 'User retrieved successfully'
}
```

### 2. Common Types (`common.ts`)
Defines foundational interfaces used across the application.

#### Key Interfaces
- `BaseEntity`: Common database entity structure
- `Address`: Address representation
- `Money`: Monetary value with currency
- `DateRange`: Date interval
- `Pagination`: Pagination parameters

**Usage Example:**
```typescript
const entity: BaseEntity = {
  id: 1,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z'
}
```

### 3. Event Types (`events.ts`)
Provides type-safe event handling mechanisms.

#### Key Interfaces
- `AppEvent<T>`: Generic application event
- `EventHandler<T>`: Event handling function type

**Usage Example:**
```typescript
const handler: EventHandler<User> = (event) => {
  console.log(event.type, event.payload)
}
```

### 4. Order Types (`order.ts`)
Defines order-related type structures.

#### Key Interfaces
- `Order`: Complete order representation
- `OrderStatus`: Possible order states
- `OrderStats`: Order statistical data

**Usage Example:**
```typescript
const order: Order = {
  id: 1,
  order_number: 'ORD-001',
  status: 'pending',
  total: 100.00
}
```

### 5. Product Types (`product.ts`)
Provides product and category type definitions.

#### Key Interfaces
- `Product`: Comprehensive product details
- `ProductCategory`: Product category structure

**Usage Example:**
```typescript
const product: Product = {
  id: 1,
  name: 'Sample Product',
  sku: 'PROD-001',
  price: 19.99,
  stock_level: 100
}
```

### 6. Sync Types (`sync.ts`)
Manages synchronization operation types.

#### Key Interfaces
- `SyncOperation`: Synchronization operation details
- `SyncStatus`: Overall synchronization status

**Usage Example:**
```typescript
const syncOp: SyncOperation = {
  id: 'sync-1',
  type: 'create',
  entity: 'product',
  status: 'pending'
}
```

### 7. User Types (`user.ts`)
Defines user-related type structures.

#### Key Interfaces
- `User`: User account details
- `UserSettings`: User preferences
- `NotificationSettings`: Notification preferences

**Usage Example:**
```typescript
const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  permissions: ['read', 'write']
}
```

### 8. Validation Types (`validation.ts`)
Provides validation rule and result types.

#### Key Interfaces
- `ValidationRule`: Validation rule definition
- `ValidationResult`: Validation outcome

**Usage Example:**
```typescript
const rule: ValidationRule = {
  type: 'required',
  message: 'Field is required'
}
```

## Best Practices

### Type Safety
- Use explicit type annotations
- Leverage TypeScript's type inference
- Avoid `any` type when possible

### Performance Considerations
- Keep interfaces minimal
- Use optional properties judiciously
- Prefer interfaces over type aliases for extensibility

## Future Improvements
- Add more comprehensive validation types
- Implement stricter type constraints
- Create more granular, reusable types
- Add runtime type checking utilities

## Development Guidelines
- Always define types explicitly
- Use generics for flexible type definitions
- Document complex type structures
- Maintain consistency across type definitions

## Security Considerations
- Avoid exposing sensitive information in types
- Use readonly properties for immutable data
- Implement proper type guards

## Testing Strategy
- Create comprehensive type tests
- Verify type compatibility
- Test edge cases and type transformations
