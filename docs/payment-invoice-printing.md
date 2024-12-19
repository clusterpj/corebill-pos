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
    // ... existing payment processing code ...

    // Create payment using the invoice
    const result = await createPayment(invoiceResult.invoice, formattedPayments)
    console.log('💰 [Payment] Payment creation result:', result)
    
    // Show invoice PDF in modal
    if (result?.invoice_id) {
      // Get the invoice details from the nested structure
      const invoice = invoiceResult?.invoice?.invoice || invoiceResult?.invoice;
      
      if (!invoice?.unique_hash) {
        console.error('📄 [Invoice PDF] Missing invoice hash:', invoice);
        window.toastr?.['error']('Could not generate invoice PDF');
        return;
      }

      // Get invoice PDF URL directly from invoice response
      const invoicePdfUrl = invoice.invoicePdfUrl || 
        `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/invoices/pdf/${invoice.unique_hash}`

      console.log('📄 [Invoice PDF] Opening PDF viewer with URL:', invoicePdfUrl)
      currentPdfUrl.value = invoicePdfUrl
      showPdfViewer.value = true
    } else {
      console.error('💰 [Payment] Missing invoice ID in payment result:', result)
      window.toastr?.['error']('Could not get invoice PDF')
    }

    // ... rest of your success handling code ...
  } catch (err) {
    console.error('💰 [Payment] Payment failed:', err)
    window.toastr?.['error'](err.message || 'Failed to process payment')
  }
}
```

### 3. Important Notes

1. **Invoice Data Structure**:
   - The invoice data might be nested: `invoiceResult.invoice.invoice`
   - Or directly accessible: `invoiceResult.invoice`
   - Always handle both cases with: `invoiceResult?.invoice?.invoice || invoiceResult?.invoice`

2. **PDF URL Construction**:
   - Use the invoice's `invoicePdfUrl` if available
   - Otherwise, construct URL using the invoice's `unique_hash`
   - Remove `/api/v1` from the base URL for PDF endpoints
   - Use the correct URL format: `https://[domain]/invoices/pdf/[unique_hash]`

3. **Error Handling**:
   - Validate that invoice has a `unique_hash`
   - Handle missing or invalid hash scenarios
   - Show appropriate error messages to users

4. **Modal Display**:
   - Use the `PdfViewerDialog` component to display the PDF
   - Set `currentPdfUrl.value` with the invoice PDF URL
   - Show the modal using `showPdfViewer.value = true`

### 4. Response Structures

#### Invoice Response Structure:
```javascript
{
  success: true,
  invoice: {
    id: 179,
    unique_hash: "6764608bd99c31.86596034",
    invoicePdfUrl: "https://lajuanita.corebill.co/invoices/pdf/6764608bd99c31.86596034",
    invoice_number: "INV-000176",
    // ... other invoice details
  }
}
```

#### Payment Response Structure:
```javascript
{
  payment_date: "2024-12-19T18:18:23.000000Z",
  user_id: 3,
  amount: 1835,
  payment_number: "PAY-000076",
  invoice_id: 181,
  unique_hash: "6764636f704350.81793456",
  // ... other payment details
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
