# CorePOS Items Components Documentation

## Overview
This directory contains components related to item management in the CorePOS application.

## Components

### 1. ItemManagementModal.vue
A comprehensive modal for creating and editing items in the inventory system.

**Key Features:**
- Dynamic form for item creation and editing
- Validation for item details
- Image upload functionality
- Integration with POS and Company stores
- Error handling and logging

**Form Fields:**
- Item Name
- SKU
- Price
- Category
- Stock Level
- Reorder Level
- Description
- Item Image

**Validation:**
- Required field checks
- Numeric value validation
- Store selection validation

**Image Handling:**
- File upload support
- Base64 image preview
- Image removal functionality

**Store Interactions:**
- Uses `usePosStore` for item and category management
- Uses `useCompanyStore` for store selection
- Supports creating and updating items

**Error Management:**
- Comprehensive error logging
- User-friendly error messages
- Toastr notifications

**Workflow:**
1. Select or create an item
2. Fill out item details
3. Optional image upload
4. Save or update item
5. Receive feedback via toastr

## Best Practices
- Uses Vue 3 Composition API
- Integrated with Vuetify 3
- Follows responsive design principles
- Implements comprehensive error handling
- Supports loading states
- Maintains consistent logging

## Dependencies
- Vue 3
- Vuetify 3
- POS Store
- Company Store
- Logger Utility
