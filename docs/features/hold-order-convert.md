# Hold Order Conversion Process

This document describes the process of converting a held order into an invoice in the CorePOS system.

## Overview

The conversion process takes a held order and creates a new invoice with the following steps:
1. Validates company settings
2. Generates a new invoice number
3. Formats the order data according to API requirements
4. Creates the invoice
5. Shows payment dialog for processing

## Implementation Details

### Location
The implementation is in `src/views/pos/components/held-orders/composables/useHeldOrders.js`

### Flow

1. **User Interface**:
   - User clicks "Convert" button in HeldOrdersTable component
   - Triggers `handleConvertOrder` in HeldOrdersModal
   - Calls `convertToInvoice` from useHeldOrders composable

2. **Conversion Process**:
```javascript
const convertToInvoice = async (invoice) => {
  // 1. Get company settings
  // 2. Get next invoice number
  // 3. Format data
  // 4. Create invoice
  // 5. Show payment dialog
}
```

### Required Data Structures

#### Item Structure
Each item in the invoice must have this structure:
```javascript
{
  item_id: string,     // Database ID of the item
  name: string,        // Item name
  description: string, // Item description
  price: number,       // Price in cents
  quantity: number,    // Quantity as integer
  unit_name: string,   // Unit name (default: 'units')
  sub_total: number,   // Price * quantity in cents
  total: number,       // Price * quantity in cents
  discount: string,    // Default: "0"
  discount_val: number,// Default: 0
  discount_type: string,// Default: "fixed"
  tax: number,        // Tax amount in cents
  retention_amount: number,   // Default: 0
  retention_concept: null,    // Default: null
  retention_percentage: null, // Default: null
  retentions_id: null        // Default: null
}
```

#### Invoice Structure
The invoice data must include:
```javascript
{
  // Required boolean flags
  avalara_bool: false,
  banType: true,
  package_bool: false,
  print_pdf: false,
  save_as_draft: false,
  send_email: false,
  not_charge_automatically: false,
  is_hold_invoice: true,
  is_invoice_pos: 1,
  is_pdf_pos: boolean,

  // IDs and references
  invoice_number: string,    // Format: "PREFIX-NUMBER" (e.g., "INV-000012")
  invoice_template_id: 1,
  invoice_pbx_modify: 0,
  hold_invoice_id: number,
  store_id: number,
  cash_register_id: number,
  user_id: number,          // Original user ID from held order

  // Dates
  invoice_date: string,     // Format: "YYYY-MM-DD"
  due_date: string,         // Format: "YYYY-MM-DD"

  // Amounts (all in cents)
  sub_total: number,
  total: number,
  due_amount: number,
  tax: number,

  // Discount
  discount: string,         // Default: "0"
  discount_type: string,    // Default: "fixed"
  discount_val: number,     // In cents
  discount_per_item: string,// Default: "NO"

  // Tip
  tip: string,             // Default: "0"
  tip_type: string,        // Default: "fixed"
  tip_val: number,         // In cents

  // Arrays
  items: Array,            // Array of items with structure above
  taxes: Array,            // Default: []
  packages: Array,         // Default: []
  tables_selected: Array,  // Table data from original order

  // Optional fields
  notes: string,           // Rich text field, should be empty
  description: string      // Order description
}
```

### Important Notes

1. **Invoice Number Format**:
   - Must include hyphen between prefix and number
   - Example: "INV-000012"

2. **Table Data**:
   - Moved from notes to tables_selected array
   - Original notes field should be empty (reserved for rich text)

3. **Monetary Values**:
   - All monetary values must be in cents
   - Use toCents function to convert from dollars

4. **Required Fields Validation**:
   - invoice_number
   - invoice_date
   - due_date
   - total
   - sub_total
   - items
   - user_id

### Error Handling

Common errors to handle:
1. Missing user_id
2. Invalid item_id
3. Missing required fields
4. Invalid invoice number format
5. Failed API calls

### API Endpoints

The process uses these endpoints:
1. GET company settings
2. GET next invoice number
3. POST create invoice
4. GET created invoice details
5. GET payment methods

## Testing

To test the conversion process:
1. Create a held order
2. Click convert button
3. Verify invoice data in console logs
4. Check payment dialog appears
5. Verify successful payment completion
6. Confirm held order is deleted

## Troubleshooting

If conversion fails, check:
1. Console logs for detailed error messages
2. Item structure matches required format
3. All required fields are present
4. Monetary values are in cents
5. User ID is present and valid
