# Hold Order Delete Implementation

This document details the implementation of the hold order delete functionality in the CorePOS system.

## Overview

The hold order delete feature allows users to remove existing held orders from the POS system. The implementation follows a multi-step process with proper validation, error handling, and user feedback.

## Implementation Details

### 1. API Layer (`src/services/api/pos-api.js`)

The delete operation is handled through the `holdInvoice.delete` method:

```javascript
async delete(id) {
  logger.startGroup('POS API: Delete Hold Invoice')
  try {
    if (!id) {
      throw new Error('Hold invoice ID is required')
    }

    const endpoint = getApiEndpoint('pos.holdInvoiceDelete')
    logger.info('Deleting hold invoice at endpoint:', endpoint)
    logger.debug('Delete hold invoice ID:', id)
    
    const response = await apiClient.post(endpoint, { id })
    logger.debug('Delete response:', response.data)

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete hold invoice')
    }

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    logger.error('Failed to delete hold invoice', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete hold invoice'
    }
  } finally {
    logger.endGroup()
  }
}
```

Key Points:
- Endpoint: `/v1/core-pos/hold-invoice/delete`
- Method: POST
- Required Parameter: `id`
- Validates ID presence
- Returns standardized response format

### 2. Store Layer (`src/stores/pos/orders.js`)

The delete operation is managed in the `deleteHoldInvoice` method:

```javascript
const deleteHoldInvoice = async (id) => {
  logger.startGroup('Orders Module: Delete Hold Invoice')
  state.loading.value.holdInvoices = true
  state.error.value = null

  try {
    const response = await posApi.holdInvoice.delete(id)
    if (response.success) {
      await fetchHoldInvoices() // Refresh the list
      logger.info('Hold invoice deleted successfully:', id)
      return { success: true }
    }
    throw new Error(response.message || 'Failed to delete hold invoice')
  } catch (error) {
    logger.error('Failed to delete hold invoice:', error)
    state.error.value = error.message
    return { success: false, error: error.message }
  } finally {
    state.loading.value.holdInvoices = false
    logger.endGroup()
  }
}
```

Key Points:
- Manages loading state
- Handles error state
- Refreshes hold invoices list after successful deletion
- Returns standardized response format

### 3. UI Layer

#### 3.1 Table Component (`src/views/pos/components/held-orders/components/HeldOrdersTable.vue`)

Displays the delete button and emits delete event:

```html
<v-btn
  size="small"
  color="error"
  variant="elevated"
  @click="$emit('delete', invoice)"
  :loading="deletingOrder === invoice.id"
  :disabled="loadingOrder === invoice.id || convertingOrder === invoice.id"
>
  <v-icon size="small" class="mr-1">mdi-delete</v-icon>
  Delete
</v-btn>
```

Key Points:
- Visual feedback with loading state
- Disabled state during other operations
- Emits delete event with invoice data

#### 3.2 Confirmation Dialog (`src/views/pos/components/held-orders/components/DeleteConfirmationDialog.vue`)

Handles user confirmation:

```html
<v-dialog persistent>
  <v-card>
    <v-card-title>Delete Order</v-card-title>
    <v-card-text>
      <p>Are you sure you want to delete this order?</p>
      <v-alert v-if="orderDescription" type="warning" variant="tonal">
        <strong>Order Description:</strong><br>
        {{ orderDescription }}
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-btn :disabled="loading">Cancel</v-btn>
      <v-btn color="error" :loading="loading">Delete</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

Key Points:
- Persistent dialog to prevent accidental closing
- Shows order description for confirmation
- Loading state during deletion
- Disabled cancel button during operation

#### 3.3 Modal Component (`src/views/pos/components/held-orders/HeldOrdersModal.vue`)

Orchestrates the delete flow:

```javascript
const handleDeleteOrder = (invoice) => {
  if (!invoice?.id) {
    window.toastr?.['error']('Invalid order selected')
    return
  }
  selectedInvoice.value = invoice
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!selectedInvoice.value?.id) {
    window.toastr?.['error']('Invalid order selected')
    return
  }

  try {
    isDeleting.value = true
    const success = await deleteOrder(selectedInvoice.value.id)
    
    if (success) {
      deleteDialog.value = false
      await fetchHoldInvoices()
      window.toastr?.['success']('Order deleted successfully')
    }
  } catch (error) {
    window.toastr?.['error'](error.message || 'Failed to delete order')
  } finally {
    isDeleting.value = false
    selectedInvoice.value = null
  }
}
```

Key Points:
- Validates invoice data
- Manages dialog state
- Handles loading state
- Provides user feedback
- Refreshes data after deletion

## Delete Flow

1. User Interaction:
   - User clicks delete button in table
   - System validates invoice has ID
   - Shows confirmation dialog with order details

2. Confirmation:
   - User sees order description
   - Can cancel operation
   - Confirms deletion

3. Processing:
   - Shows loading state
   - Disables cancel button
   - Makes API call with ID
   - Handles response

4. Completion:
   - Shows success/error notification
   - Refreshes order list
   - Closes dialog
   - Resets state

## Error Handling

1. API Layer:
   - Validates required ID
   - Handles API response errors
   - Returns standardized error format

2. Store Layer:
   - Manages loading/error states
   - Handles API call failures
   - Updates UI state accordingly

3. UI Layer:
   - Validates user input
   - Shows loading states
   - Displays error messages
   - Prevents invalid operations

## Important Notes

1. ID Validation:
   - Required at all layers
   - Prevents invalid API calls
   - Ensures data integrity

2. User Feedback:
   - Loading indicators
   - Success/error messages
   - Clear operation status

3. State Management:
   - Proper loading states
   - Error handling
   - Data refresh after operations

4. Error Recovery:
   - Clear error messages
   - Ability to retry
   - Clean state reset

5. Performance:
   - Optimized API calls
   - Efficient state updates
   - Responsive UI feedback
