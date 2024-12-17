# Hold Order Update Implementation

This document details the implementation of the hold order update functionality in the CorePOS system.

## Overview

The hold order update feature allows updating existing held orders in the POS system. The key identifier for updates is the order description, not the order ID.

## Implementation Details

### 1. API Layer (`src/services/api/pos-api.js`)

The hold order update is handled through the `holdInvoice.update` method:

```javascript
async update(description, invoiceData) {
  logger.startGroup('POS API: Update Hold Invoice')
  try {
    logger.info(`Updating hold invoice with description: ${description}`)
    logger.debug('Hold invoice update data:', invoiceData)

    // Send complete payload to the endpoint
    const response = await apiClient.post('/v1/core-pos/hold-invoices', {
      ...invoiceData,
      description, // Key identifier for updates
      is_hold_invoice: true
    })

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    logger.error('Failed to update hold invoice', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to update hold invoice'
    }
  } finally {
    logger.endGroup()
  }
}
```

Key Points:
- Endpoint: `/v1/core-pos/hold-invoices`
- Method: POST
- Description is used as the key identifier
- Sets `is_hold_invoice: true` for updates

### 2. Store Layer (`src/stores/pos/orders.js`)

The update logic is handled in the `updateHoldInvoice` method:

```javascript
const updateHoldInvoice = async (description, orderData) => {
  logger.startGroup('Orders Module: Update Hold Invoice')
  state.loading.value.holdInvoices = true
  state.error.value = null

  try {
    if (!description) {
      throw new Error('Order description is required for update')
    }

    validateHoldInvoiceData(orderData)
    const formattedData = prepareHoldInvoiceData(orderData)
    
    const response = await posApi.holdInvoice.update(description, {
      ...formattedData,
      print_pdf: false,
      is_invoice_pos: 1,
      is_pdf_pos: true,
      send_email: false,
      save_as_draft: false,
      not_charge_automatically: false,
      package_bool: false,
      invoice_number: "-",
      discount_per_item: "NO",
      tip_type: null,
      tip: 0,
      tip_val: 0,
      tables_selected: [],
      is_hold_invoice: true
    })
    
    if (response.success) {
      await fetchHoldInvoices() // Refresh the list
      return { success: true, data: response.data }
    }
    
    throw new Error(response.message || 'Failed to update hold invoice')
  } catch (error) {
    state.error.value = error.message
    return { success: false, error: error.message }
  } finally {
    state.loading.value.holdInvoices = false
    logger.endGroup()
  }
}
```

Key Points:
- Validates required data before update
- Formats data to match API requirements
- Includes all required fields for the update payload
- Refreshes hold invoices list after successful update

### 3. UI Layer (`src/views/pos/components/PosCart.vue`)

The update is triggered from the cart component:

```javascript
const updateOrder = async () => {
  try {
    const description = cartStore.holdOrderDescription
    if (!description) {
      throw new Error('No order description found')
    }

    updating.value = true
    logger.debug('Updating order with description:', description)

    const orderData = cartStore.prepareHoldInvoiceData(
      posStore.selectedStore,
      posStore.selectedCashier,
      description
    )

    const response = await posStore.updateHoldInvoice(description, orderData)

    if (response.success) {
      window.toastr?.['success']('Order updated successfully')
      cartStore.setHoldInvoiceId(null)
      cartStore.clearCart() // Clear cart after successful update
    } else {
      throw new Error(response.message || 'Failed to update order')
    }
  } catch (error) {
    logger.error('Failed to update order:', error)
    window.toastr?.['error'](error.message || 'Failed to update order')
  } finally {
    updating.value = false
  }
}
```

Key Points:
- Uses description from cart store as identifier
- Provides visual feedback during update process
- Handles errors with user notifications
- Clears hold invoice ID after successful update
- Clears cart after successful update to reset the state

## Required Payload Structure

The update endpoint expects a payload in this format:

```javascript
{
  "print_pdf": false,
  "is_invoice_pos": 1,
  "is_pdf_pos": true,
  "avalara_bool": false,
  "send_email": false,
  "save_as_draft": false,
  "not_charge_automatically": false,
  "package_bool": false,
  "invoice_date": "2024-11-04",
  "due_date": "2024-11-11",
  "invoice_number": "-",
  "user_id": 3,
  "total": 50249, // in cents
  "due_amount": 50249,
  "sub_total": 50249,
  "tax": 0,
  "discount_type": "fixed",
  "discount": "0.00",
  "discount_val": 0,
  "discount_per_item": "NO",
  "items": [
    {
      "name": "Item Name",
      "description": null,
      "discount": "0.00",
      "discount_val": 0,
      "quantity": 1,
      "price": 49900, // in cents
      "sub_total": 49900,
      "total": 49900,
      "tax": 0,
      "unit_name": "unit",
      "retention_amount": 0,
      "retention_concept": "NO_RETENTION",
      "retention_percentage": "0.00",
      "item_id": 52
    }
  ],
  "invoice_template_id": 1,
  "banType": true,
  "invoice_pbx_modify": 0,
  "packages": [],
  "cash_register_id": 1,
  "taxes": {},
  "description": "DINE_IN_Table_2", // Key identifier for updates
  "is_hold_invoice": true,
  "store_id": 1
}
```

## Important Notes

1. Description as Identifier:
   - The system uses the order description as the key identifier for updates
   - Description must be preserved throughout the update process
   - Updates will fail if description is missing

2. Price Handling:
   - All prices must be in cents in the API payload
   - Conversion from dollars to cents happens in the store layer

3. Required Fields:
   - All fields shown in the payload structure are required
   - Missing fields will cause the update to fail

4. Error Handling:
   - Validation occurs at multiple levels (UI, Store, API)
   - User is notified of any failures via toastr notifications
   - Failed updates do not clear the hold invoice ID or cart state

5. Cart State:
   - Cart is automatically cleared after a successful update
   - Cart remains unchanged if the update fails
   - This ensures a clean state for new orders after updates
