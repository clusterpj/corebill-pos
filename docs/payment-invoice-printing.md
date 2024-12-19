# Invoice Printing Implementation Guide

## Overview
This guide explains how to implement invoice printing functionality in payment dialogs for the CoreBill POS system.

## Implementation Details

### 1. Payment Processing Flow
The invoice printing happens automatically after a successful payment. Here's the flow:

1. Process the payment
2. Get the invoice details from the payment response
3. Extract the invoice's unique hash
4. Display the PDF in a modal dialog
5. Handle any potential errors

### 2. Code Implementation

```vue
// Inside your payment processing function
const processPayment = async () => {
  try {
    // ... payment processing code ...

    // Display invoice PDF after successful payment
    if (result?.invoice_id) {
      const invoice = finalInvoice?.invoice?.invoice || finalInvoice?.invoice
      
      if (!invoice?.unique_hash) {
        console.error('📄 [Invoice PDF] Missing invoice hash:', invoice)
        throw new Error('Could not generate invoice PDF: Missing invoice hash')
      }

      // Get invoice PDF URL with fallback
      const invoicePdfUrl = invoice.invoicePdfUrl || 
        `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/invoices/pdf/${invoice.unique_hash}`

      console.log('📄 [Invoice PDF] Opening PDF viewer with URL:', invoicePdfUrl)
      currentPdfUrl.value = invoicePdfUrl
      showPdfViewer.value = true
    } else {
      console.error('📄 [Invoice PDF] Missing invoice ID in result:', result)
      throw new Error('Could not get invoice PDF: Missing invoice ID')
    }

    // Close dialog and emit completion
    emit('payment-complete', true)
    dialog.value = false
  } catch (error) {
    console.error('📄 [Invoice PDF] Failed to display invoice:', error)
    window.toastr?.['error'](error.message || 'Failed to display invoice PDF')
  }
}

// PDF viewer handling
const handlePdfViewerClosed = () => {
  showPdfViewer.value = false
  currentPdfUrl.value = null
}
```

### 3. Important Notes

1. **Invoice Data Structure**:
   - The invoice data might be nested: `finalInvoice.invoice.invoice`
   - Or directly accessible: `finalInvoice.invoice`
   - Always handle both cases with optional chaining

2. **PDF URL Construction**:
   - First try to use the invoice's `invoicePdfUrl` property
   - Fall back to constructing URL with `unique_hash`
   - Remove `/api/v1` from base URL for PDF endpoints
   - Use template literals for clean URL construction

3. **Error Handling**:
   - Validate presence of `invoice_id` and `unique_hash`
   - Show user-friendly error messages via toastr
   - Log detailed error information for debugging
   - Handle all potential error scenarios

4. **PDF Viewer Component**:
   - Use `PdfViewerDialog` for displaying PDFs
   - Set `currentPdfUrl.value` with the invoice URL
   - Control visibility with `showPdfViewer.value`
   - Clean up on close with `handlePdfViewerClosed`

### 4. Response Structure

#### Invoice Response Structure:
```javascript
{
  success: true,
  invoice: {
    id: 179,
    unique_hash: "6764608bd99c31.86596034",
    invoicePdfUrl: "https://example.corebill.co/invoices/pdf/6764608bd99c31.86596034",
    invoice_number: "INV-000176"
  }
}
```

## Best Practices

1. **URL Construction**:
   - Prefer using the invoice's `invoicePdfUrl` if available
   - Fall back to constructing URL with `unique_hash`
   - Always remove `/api/v1` from base URL for PDF endpoints
   - Use template literals for clean URL construction

2. **Data Access**:
   - Handle nested invoice data structures
   - Use optional chaining to prevent errors
   - Validate required fields before URL construction

3. **Debugging**:
   - Log invoice and payment details
   - Include full invoice object in debug logs
   - Monitor PDF URL construction steps

4. **Error Messages**:
   - Show user-friendly error messages
   - Log detailed error information for debugging
   - Handle all potential error scenarios
