# CorePOS Services Documentation

## Overview
The services directory provides core utilities for API interactions, offline support, and application-wide service management.

## Directory Structure
```
services/
├── offline.js                 # Offline mode and network utilities
└── api/                       # API service modules
    ├── auth.js                # Authentication services
    ├── client.js              # Axios-based API client
    ├── config.js              # API configuration management
    ├── index.js               # API service exports
    ├── pos-api.js             # Comprehensive POS API operations
    ├── users.js               # User management API
    └── pos-operations/        # Modular POS operation services
        ├── config.js          # POS operations configuration
        ├── index.js           # POS operations exports
        ├── invoice.js         # Invoice-specific operations
        ├── order.js           # Order management operations
        ├── payment.js         # Payment processing operations
        └── utils.js           # Utility functions for POS operations
```

## Key Services

### 1. Offline Services (`offline.js`)
- Network connectivity detection
- Request synchronization queue
- Offline mode support

#### Functions
- `isOffline()`: Check current network status
- `addToSyncQueue()`: Queue requests for later sync

### 2. API Services (`api/`)

#### Authentication (`auth.js`)
- User login/logout mechanisms
- Profile retrieval
- Credential management

#### API Client (`client.js`)
- Centralized HTTP request management
- Axios interceptors
- Request/response logging
- Error handling
- Rate limit management

#### Configuration (`config.js`)
- Environment-based API configuration
- Endpoint definitions
- URL generation utilities

#### POS API (`pos-api.js`)
Comprehensive API service for Point of Sale operations:
- Company settings
- Employee management
- Cash register operations
- Product management
- Store management
- Invoice processing
- Payment handling
- Hold invoice management

#### Users API (`users.js`)
- User CRUD operations
- User list retrieval
- User profile management

### 3. POS Operations (`pos-operations/`)

#### Invoice Operations (`invoice.js`)
- Invoice creation
- Invoice retrieval
- Invoice number generation

#### Order Operations (`order.js`)
- Order management
- Order status tracking
- Order processing utilities

#### Payment Operations (`payment.js`)
- Payment method retrieval
- Payment processing
- Payment tracking

#### Utility Functions (`utils.js`)
- Helper functions for POS operations
- Data transformation
- Validation utilities

## Best Practices
- Centralized API configuration
- Comprehensive error handling
- Detailed logging
- Modular design
- Environment-specific configurations
- Separation of concerns

## Dependencies
- Axios
- Logger utility
- Environment configuration

## Future Roadmap
- Enhanced offline support
- Improved request synchronization
- More granular error handling
- TypeScript type definitions
- Expanded API operation coverage

## Development Guidelines
- Use environment-specific configurations
- Implement comprehensive logging
- Handle errors gracefully
- Keep services modular and focused
- Use TypeScript for type safety
