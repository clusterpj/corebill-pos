# CorePOS Utility Functions and Helpers

## Overview
The `utils/` directory contains essential utility functions, error handling, logging, session management, and validation utilities that support the CorePOS application's core functionality.

## Directory Structure
```
utils/
├── __tests__/           # Utility function tests
├── errors.js            # Custom error classes
├── logger.js            # Advanced logging utility
├── sessionManager.js    # Session management and authentication handling
├── validation.js        # Form validation and input validation utilities
└── validators/          # Additional validator implementations
```

## Utility Modules

### 1. Error Handling (`errors.js`)
Provides custom error classes for standardized error management.

#### Key Error Classes
- `ApiError`: Standardized API error handling
- `ValidationError`: Form and input validation errors

**Usage Example:**
```javascript
throw new ApiError('AUTH_FAILED', 'Authentication unsuccessful', { details: 'Invalid credentials' })
```

### 2. Logger (`logger.js`)
Advanced logging utility with environment-aware logging and comprehensive log formatting.

#### Key Features
- Environment-based logging (development only)
- Log level management
- Grouped logging
- HTTP and API request/response logging

**Log Levels:**
- DEBUG
- INFO
- WARN
- ERROR
- HTTP

**Usage Example:**
```javascript
logger.debug('User login attempt', { username: 'john_doe' })
logger.http('GET', '/api/users', requestConfig, response)
```

### 3. Session Management (`sessionManager.js`)
Handles session lifecycle, token refresh, and authentication state.

#### Key Features
- Session restoration
- Token refresh mechanism
- Online/offline handling
- Window focus event management

**Session Lifecycle:**
- Initialize session
- Refresh token
- Handle session expiration
- Manage network connectivity

**Usage Example:**
```javascript
await sessionManager.initialize()
sessionManager.setupRefreshInterval()
```

### 4. Validation (`validation.js`)
Comprehensive form and input validation utility.

#### Validation Methods
- `required`: Ensure field is not empty
- `email`: Email format validation
- `numeric`: Numeric value validation
- `minLength`: Minimum length validation
- `maxLength`: Maximum length validation

**Usage Example:**
```javascript
const errors = validateForm(formData, {
  email: ['required', 'email'],
  password: ['required', ['minLength', 8]]
})
```

## Best Practices

### Error Handling
- Use custom error classes
- Provide detailed error information
- Log errors comprehensively

### Logging
- Use environment-specific logging
- Include contextual information
- Avoid logging sensitive data

### Session Management
- Implement secure token refresh
- Handle network interruptions
- Provide user-friendly session expiration warnings

### Validation
- Use declarative validation rules
- Support complex validation scenarios
- Provide clear error messages

## Performance Considerations
- Minimize logging in production
- Optimize validation performance
- Use efficient token refresh strategies

## Security Considerations
- Never log sensitive information
- Secure token storage
- Implement proper session timeout
- Validate and sanitize all inputs

## Future Improvements
- Enhanced TypeScript type definitions
- More comprehensive validators
- Advanced logging configurations
- Improved session management strategies

## Testing Strategy
- Unit test each utility function
- Test error scenarios
- Validate logging output
- Comprehensive session management tests

## Dependencies
- Vue
- Pinia (for auth store)
- Browser APIs (localStorage, events)

## Development Guidelines
- Keep utilities pure and side-effect free
- Document all functions
- Provide clear error messages
- Use TypeScript for type safety
