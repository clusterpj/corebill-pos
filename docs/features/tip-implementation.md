# Tip Implementation Documentation

## Overview
The tip implementation allows users to add tips to their payments in the POS system. Tips can be added either through preset percentages or custom amounts.

## Features
1. Tip Selection Dialog
   - Preset tip percentages (15%, 18%, 20%, 25%)
   - Custom tip percentage input
   - Real-time tip amount calculation
   - Ability to update or remove tips

2. Payment Integration
   - Tips are included in the total payment amount
   - Full payment validation including tips
   - Proper API integration with tip parameters

## Implementation Details

### UI Components
The tip functionality is implemented in `src/views/pos/components/dialogs/PaymentDialog.vue`:

1. Tip Button
```vue
<v-btn block color="primary" variant="outlined" @click="showTipDialog = true">
  {{ tipAmount > 0 ? `Update Tip (${formatCurrency(tipAmount / 100)})` : 'Add Tip' }}
</v-btn>
```

2. Tip Selection Dialog
```vue
<v-dialog v-model="showTipDialog" max-width="400px">
  <!-- Preset Percentages -->
  <v-row class="mb-4">
    <v-col v-for="percent in tipPercentages" :key="percent" cols="3">
      <v-btn block @click="selectTipPercent(percent)">
        {{ percent }}%
      </v-btn>
    </v-col>
  </v-row>

  <!-- Custom Tip Input -->
  <v-text-field
    v-model="customTipPercent"
    label="Custom %"
    type="number"
    append-inner-text="%"
  />
</v-dialog>
```

### State Management
```javascript
// Tip related state
const showTipDialog = ref(false)
const tipPercentages = [15, 18, 20, 25]
const selectedTipPercent = ref(null)
const customTipPercent = ref('')
const tipAmount = ref(0)
const tipType = ref('percentage')
```

### Tip Calculation
```javascript
const calculatedTip = computed(() => {
  const percent = selectedTipPercent.value || Number(customTipPercent.value) || 0
  return Math.round((invoiceTotal.value * percent) / 100)
})
```

### Payment Processing
When processing a payment with tip:
```javascript
const processPayment = async () => {
  // Calculate total amount including tip
  const totalAmount = invoiceTotal.value + tipAmount.value

  // Create invoice data with tip
  const invoiceData = {
    ...props.invoice.invoice,
    tip: selectedTipPercent.value || Number(customTipPercent.value) || 0,
    tip_type: tipType.value,
    tip_val: tipAmount.value,
    total: totalAmount,
    due_amount: totalAmount,
    sub_total: invoiceTotal.value
  }
}
```

## API Integration

### Tip Parameters
When sending payment data to the API:
- `tip`: The tip percentage (e.g., 15 for 15%)
- `tip_type`: Set to "percentage"
- `tip_val`: The tip amount in cents
- `total`: Total amount including tip
- `due_amount`: Total amount including tip
- `sub_total`: Original invoice amount without tip

### Example API Payload
```javascript
{
  // Original invoice data
  ...invoice,
  
  // Tip information
  tip: 15,
  tip_type: "percentage",
  tip_val: 500, // $5.00 in cents
  
  // Updated totals
  total: 3500,    // $35.00 in cents (original $30 + $5 tip)
  due_amount: 3500,
  sub_total: 3000 // Original $30.00 in cents
}
```

## Validation

1. Amount Validation
```javascript
:rules="[
  v => !!v || 'Amount is required',
  v => v > 0 || 'Amount must be greater than 0',
  v => Number(v) === (invoiceTotal + tipAmount) / 100 || 'Full payment is required'
]"
```

2. Payment Total Validation
```javascript
const isValid = computed(() => {
  return payments.value.every(payment => {
    if (!payment.method_id || !payment.amount) return false
    if (isCashOnly(payment.method_id) && !payment.received) return false
    return true
  }) && remainingAmount.value === 0
})
```

## Important Notes

1. All monetary values are handled in cents internally to avoid floating-point precision issues
2. Tips are calculated based on the original invoice total
3. The payment amount must exactly match the total including tip
4. Tips can be updated or removed before finalizing the payment
5. The UI updates automatically when tips are added or modified

## Usage Example

1. Click "Add Tip" button
2. Select a preset percentage or enter a custom amount
3. Confirm tip amount
4. Payment amount automatically updates to include tip
5. Process payment with total amount including tip

## Error Handling

1. Invalid tip amounts are prevented through input validation
2. Payment validation ensures the full amount (including tip) is paid
3. API errors are caught and displayed to the user
4. Tip calculations are rounded to avoid decimal precision issues
