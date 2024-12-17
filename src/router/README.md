# CorePOS Router Configuration

## Overview
The router configuration for CorePOS manages application navigation, authentication, and route protection.

## Route Structure

### Main Routes
- `/login`: Authentication page
- `/`: Base route with BaseLayout
  - Default redirect to `/pos`
  - Nested routes for POS, Kitchen, and Items Management
- `/:pathMatch(.*)*`: 404 Not Found page

## Authentication Flow

### Navigation Guards
- Checks authentication status before route access
- Redirects unauthenticated users to login
- Prevents authenticated users from accessing login page

### Session Management
- Initial session restoration on first navigation
- Uses `authStore.restoreSession()` for persistent authentication

## Route Metadata

### Authentication Flags
- `requiresAuth`: Determines if route requires authentication
- `layout`: Specifies layout type (default or none)

### Dynamic Route Loading
- Lazy-loaded components for performance optimization
- Uses dynamic imports for views

## Development Features
- Console logging for navigation in development mode
- Dynamic document title setting

## Security Considerations
- Prevents unauthorized access to protected routes
- Redirects to login with original destination as query parameter
- Handles navigation errors gracefully

## Imported Route Modules
- POS Routes (`pos.routes.js`)
- Kitchen Routes (`kitchen.routes.js`)

## Router Configuration
- Uses `createWebHistory` for clean URL routing
- Base URL configurable via environment variables

## Best Practices
- Modular route configuration
- Lazy loading of components
- Centralized authentication logic
- Error handling and logging
- Environment-specific behaviors

## Dependencies
- Vue Router
- Auth Store
- BaseLayout Component
