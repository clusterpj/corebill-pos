# CorePOS Store Architecture Documentation

## Overview
The stores directory implements a modular Pinia-based state management system for the CorePOS application, providing centralized, reactive state management across different domains.

## Directory Structure
```
stores/
├── __tests__/               # Store unit tests
├── auth.js                  # Authentication state management
├── cart/                    # Cart-related state modules
├── cart-store.js            # Centralized cart store
├── company/                 # Company-related state modules
├── company.js               # Centralized company store
├── error.js                 # Global error handling store
├── index.js                 # Pinia configuration
├── loading.js               # Global loading state management
├── pos/                     # POS-specific state modules
└── pos-store.js             # Centralized POS store
```

## Store Architecture Principles

### 1. Modular Design
- Each store follows a consistent structure
- Supports composition and separation of concerns
- Enables easy testing and maintenance

### 2. State Management Patterns
- Uses Pinia for reactive state management
- Composition API-based stores
- Centralized store with modular sub-modules

### 3. Key Stores

#### Authentication Store (`auth.js`)
- Manages user authentication state
- Handles login, logout, and session restoration
- Provides user permission management

**Key Features:**
- Token management
- User role detection
- Permission-based access control
- Secure session handling

#### Cart Store (`cart-store.js`)
- Manages shopping cart state and operations
- Supports item addition, removal, and modification
- Prepares invoice and hold invoice data

**Key Features:**
- Dynamic cart manipulation
- Invoice preparation
- State mutation methods

#### Company Store (`company.js`)
- Centralizes company-related state
- Manages customer, store, and cashier selections
- Provides initialization and selection logic

**Key Features:**
- Multi-module state management
- Automatic store and customer selection
- Comprehensive initialization process

#### Error Store (`error.js`)
- Centralized error handling
- Manages global and field-specific errors
- Provides error display and management

**Key Features:**
- Error state tracking
- Automatic error dismissal
- Field-specific error retrieval

#### Loading Store (`loading.js`)
- Manages global loading states
- Supports multiple concurrent loading indicators

**Key Features:**
- Dynamic loading key management
- Loading state queries

#### POS Store (`pos-store.js`)
- Comprehensive Point of Sale state management
- Integrates products, orders, and other POS-related states

**Key Features:**
- Modular state creation
- API integration
- Comprehensive initialization

## Advanced Features

### 1. Store Composition
- Stores use composition for modularity
- Sub-modules can be easily added or modified
- Supports complex state interactions

### 2. API Integration
- Seamless integration with API services
- Centralized data fetching and state updates
- Error and loading state management

### 3. Reactive State Management
- Uses Vue's Composition API
- Leverages Pinia's reactivity
- Supports complex state transformations

## Best Practices

### State Management
- Keep state minimal and focused
- Use getters for derived state
- Implement clear, predictable mutations

### Error Handling
- Centralize error management
- Provide detailed error information
- Support automatic and manual error clearing

### Performance
- Minimize unnecessary state updates
- Use computed properties for complex derivations
- Implement lazy loading where possible

## Security Considerations
- Secure token management
- Permission-based access control
- Protect sensitive user information

## Future Improvements
- Enhanced TypeScript type definitions
- More granular permission management
- Improved offline support
- Advanced caching strategies

## Development Guidelines
- Follow Pinia best practices
- Use composition for modularity
- Implement comprehensive logging
- Write unit tests for store logic

## Dependencies
- Pinia
- Vue Composition API
- Vue Router
- Axios (for API interactions)
- Logger utility

## Testing Strategy
- Unit test each store module
- Test state mutations
- Verify API interaction logic
- Validate error handling scenarios
