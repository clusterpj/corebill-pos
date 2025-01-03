# CorePOS Payment Integration Guide

## Overview

This guide covers the integration of payment processing capabilities into the CorePOS system, including terminal payments, payment methods management, and transaction processing.

## Quick Start

1. Set up the API client
2. Fetch available payment methods 
3. Get terminal settings if using terminal payments
4. Process transactions

## API Client Setup

```typescript
// api/payment-api.ts
import axios from 'axios';

const BASE_URL = 'https://lajuanita.corebill.co/api';

const paymentApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

paymentApi.interceptors.request.use((config) => {
  config.headers.company = '1'; // Your company ID
  return config;
});

export const paymentService = {
  getPaymentMethods: async (params = { orderByField: 'created_at', orderBy: 'desc', page: 1 }) => {
    return paymentApi.get('/v1/payment-methods', { params });
  },

  getTerminalSettings: async () => {
    return paymentApi.get('/v2/ipos-pays/setting');
  },

  getDefaultTerminalSetting: async (settingId: number) => {
    return paymentApi.get(`/v2/ipos-pays/setting/${settingId}/default`);
  },

  processSale: async (settingId: number, data: {
    amount: number;
    id: number;
    invoice_ids: number[];
    payment_method_id: number;
    user_id: number;
  }) => {
    return paymentApi.post(`/v2/ipos-pays/setting/${settingId}/sale`, data);
  }
};
```

## Endpoints Reference

### 1. Payment Methods

#### `GET /v1/payment-methods`

Retrieves available payment methods for the company.

**Query Parameters:**
- `orderByField`: Field for sorting (e.g., "created_at")
- `orderBy`: Sort direction ("asc" or "desc")
- `page`: Page number for pagination

**Response:**
```typescript
interface PaymentMethodResponse {
  paymentMethods: {
    data: PaymentMethod[];
    current_page: number;
    // ... pagination fields
  };
  paymentMethodsWithSettings: PaymentMethod[];
  exist_authorize_setting: number;
  exist_paypal_setting: number;
  exist_aux_vault_setting: number;
}

interface PaymentMethod {
  id: number;
  name: string;
  status: "A" | "I";
  only_cash: number;
  add_payment_gateway: number;     // 1 for terminal payments
  account_accepted: "T" | "N";     // "T" for terminal payments
  settings_id: number | null;      // Required for terminal processing
  // ... other fields
}
```

### 2. Terminal Settings

#### `GET /v2/ipos-pays/setting`

Lists all terminal settings configurations.

#### `GET /v2/ipos-pays/setting/{settingId}/default`

Gets configuration for a specific terminal.

**Response:**
```typescript
interface TerminalSetting {
  id: number;
  name: string;
  tpn: string;                     // Terminal ID
  status: number;                  // 4 = ERROR
  status_label: string;            // Human-readable status
  environment: number;             // 0 = SANDBOX, 1 = PRODUCTION
  environment_label: string;       // "SANDBOX" | "PRODUCTION"
  endpoint: string;                // Terminal API endpoint
  enabled: number;                 // Terminal active status
  // ... configuration fields
}
```

### 3. Sales Processing

#### `POST /v2/ipos-pays/setting/{settingId}/sale`

Process a payment transaction.

**Request:**
```json
{
  "amount": 665,          // Amount in cents
  "id": 1,               // Must match settingId from URL
  "invoice_ids": [602],  // Invoice IDs to process
  "payment_method_id": 36, // Valid payment method ID
  "user_id": 25          // Customer ID
}
```

**Error Response:**
```json
{
  "message": "The selected payment method id is invalid. (and 1 more error)",
  "errors": {
    "payment_method_id": ["The selected payment method id is invalid."],
    "invoice_ids.0": ["The selected invoice_ids.0 is invalid."]
  }
}
```

## Implementation Examples

### Complete Payment Flow

```typescript
async function processPayment() {
  try {
    // 1. Get payment methods
    const { data: methodsResponse } = await paymentService.getPaymentMethods();
    
    // 2. Find terminal payment method
    const terminalMethod = methodsResponse.paymentMethods.data.find(
      method => method.add_payment_gateway === 1 && 
                method.account_accepted === 'T'
    );
    
    if (!terminalMethod?.settings_id) {
      throw new Error('No valid terminal payment method found');
    }

    // 3. Verify terminal settings
    const { data: settingResponse } = await paymentService.getDefaultTerminalSetting(
      terminalMethod.settings_id
    );

    // 4. Process sale
    const saleData = {
      amount: 665,
      id: terminalMethod.settings_id,
      invoice_ids: [602],
      payment_method_id: terminalMethod.id,
      user_id: 25
    };

    return await paymentService.processSale(
      terminalMethod.settings_id,
      saleData
    );

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Payment Error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Payment failed');
    }
    throw error;
  }
}
```

## Important Notes

### Payment Methods
- Terminal payments require:
  - `add_payment_gateway = 1`
  - `account_accepted = "T"`
  - Valid `settings_id`

### Terminal Settings
- Check `environment` for SANDBOX/PRODUCTION
- Verify `enabled = 1` before processing
- Monitor `status` for terminal health

### Transaction Processing
- Amount should be in cents (bigint)
- `id` in body must match URL's `settingId`
- Always validate payment method availability
- Handle error responses properly

## Best Practices

1. **Error Handling**
   - Implement comprehensive error handling
   - Log failed transactions
   - Provide clear user feedback

2. **Validation**
   - Verify terminal status before processing
   - Validate amounts and IDs
   - Check payment method availability

3. **Testing**
   - Test in SANDBOX environment first
   - Verify all error scenarios
   - Test amount handling thoroughly