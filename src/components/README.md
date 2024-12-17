# CorePOS Components Documentation

## Overview
This directory contains reusable Vue 3 components with Vuetify 3 integration for the CorePOS application.

## Components

### 1. AppButton.vue
A flexible, configurable button component with loading and disabled states.

**Features:**
- Customizable color, variant, and size
- Loading state support
- Event handling

### 2. BaseLayout.vue
The primary application layout managing navigation, app bar, and routing.

**Features:**
- Collapsible navigation drawer
- Dynamic navigation menu
- Customer, store, and cash register selection
- Persistent state management

### 3. DashboardStatCard.vue
A reusable card for displaying statistical information.

**Features:**
- Icon-based statistical representation
- Configurable title, value, and icon
- Consistent dashboard styling

### 4. ErrorBoundary.vue
A robust error handling component for capturing and managing runtime errors.

**Features:**
- Error capturing and logging
- Environment-specific error messages
- Error reset functionality

### 5. LoadingState.vue
A flexible loading indicator with configurable display options.

**Features:**
- Full-page and inline loading states
- Customizable text and spinner
- Responsive design

### 6. SalesChart.vue
An interactive sales overview chart using ECharts.

**Features:**
- Line chart with sales data visualization
- Period selection (Week/Month/Year)
- Responsive and interactive design

### 7. TopProducts.vue
A component for displaying top-performing products.

**Features:**
- Product name and sales count display
- Consistent card-based design

## Best Practices
- Uses Vue 3 Composition API
- Integrated with Vuetify 3
- Follows responsive design principles
- Implements error handling
- Supports loading states
