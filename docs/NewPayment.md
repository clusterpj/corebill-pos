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

#### `GET /payments/multiple/get-payment-methods`

Retrieves available payment methods for the company.

**Query Parameters:**
- `orderByField`: Field for sorting (e.g., "created_at")
- `orderBy`: Sort direction ("asc" or "desc")
- `page`: Page number for pagination

**Response:**
{
    "payment_methods": [
        {
            "id": 1,
            "name": "Cash",
            "status": "A",
            "only_cash": 1,
            "add_payment_gateway": 0,
            "paypal_button": 0,
            "stripe_button": 0,
            "company_id": 1,
            "account_accepted": "N",
            "created_at": "2024-11-30T04:30:40.000000Z",
            "updated_at": "2024-11-30T16:17:04.000000Z",
            "deleted_at": null,
            "payment_gateways_id": null,
            "settings_id": null,
            "for_customer_use": 0,
            "generate_expense": 0,
            "void_refund": 0,
            "generate_expense_id": null,
            "void_refund_expense_id": null,
            "expense_import": 0,
            "is_multiple": 0,
            "show_notes_table": 0,
            "payment_method_id": 1,
            "pos_money": [
                {
                    "id": 1,
                    "name": "$1",
                    "amount": "1.00",
                    "is_coin": 1,
                    "currency_id": 1,
                    "created_at": "2024-11-30T16:17:43.000000Z",
                    "updated_at": "2024-12-05T23:19:47.000000Z",
                    "deleted_at": null
                },
                {
                    "id": 3,
                    "name": "$5",
                    "amount": "5.00",
                    "is_coin": 1,
                    "currency_id": 1,
                    "created_at": "2024-12-05T23:20:58.000000Z",
                    "updated_at": "2024-12-05T23:20:58.000000Z",
                    "deleted_at": null
                },
                {
                    "id": 4,
                    "name": "$10",
                    "amount": "10.00",
                    "is_coin": 1,
                    "currency_id": 1,
                    "created_at": "2024-12-05T23:21:09.000000Z",
                    "updated_at": "2024-12-05T23:21:09.000000Z",
                    "deleted_at": null
                },
                {
                    "id": 5,
                    "name": "$20",
                    "amount": "20.00",
                    "is_coin": 1,
                    "currency_id": 1,
                    "created_at": "2024-12-05T23:21:21.000000Z",
                    "updated_at": "2024-12-05T23:21:21.000000Z",
                    "deleted_at": null
                },
                {
                    "id": 6,
                    "name": "$50",
                    "amount": "50.00",
                    "is_coin": 1,
                    "currency_id": 1,
                    "created_at": "2024-12-05T23:21:33.000000Z",
                    "updated_at": "2024-12-05T23:21:33.000000Z",
                    "deleted_at": null
                },
                {
                    "id": 7,
                    "name": "$100",
                    "amount": "100.00",
                    "is_coin": 1,
                    "currency_id": 1,
                    "created_at": "2024-12-05T23:21:46.000000Z",
                    "updated_at": "2025-01-03T19:17:59.000000Z",
                    "deleted_at": null
                },
                {
                    "id": 8,
                    "name": "500",
                    "amount": "500.00",
                    "is_coin": 0,
                    "currency_id": 1,
                    "created_at": "2025-01-03T19:21:03.000000Z",
                    "updated_at": "2025-01-03T19:21:03.000000Z",
                    "deleted_at": null
                }
            ],
            "formattedNameLabel": "Cash (No Gateway)",
            "registrationdatafees": null,
            "IsPaymentFeeActive": "NO"
        },
        {
            "id": 3,
            "name": "Credit Card",
            "status": "A",
            "only_cash": 0,
            "add_payment_gateway": 0,
            "paypal_button": 0,
            "stripe_button": 0,
            "company_id": 1,
            "account_accepted": "N",
            "created_at": "2024-11-30T04:30:40.000000Z",
            "updated_at": "2024-11-30T04:30:40.000000Z",
            "deleted_at": null,
            "payment_gateways_id": null,
            "settings_id": null,
            "for_customer_use": 0,
            "generate_expense": 0,
            "void_refund": null,
            "generate_expense_id": null,
            "void_refund_expense_id": null,
            "expense_import": 0,
            "is_multiple": 0,
            "show_notes_table": 0,
            "payment_method_id": 3,
            "pos_money": [],
            "formattedNameLabel": "Credit Card (No Gateway)",
            "registrationdatafees": null,
            "IsPaymentFeeActive": "NO"
        },
        {
            "id": 5,
            "name": "Terminal Account test iposPay",
            "status": "A",
            "only_cash": 0,
            "add_payment_gateway": 1,
            "paypal_button": 0,
            "stripe_button": 0,
            "company_id": 1,
            "account_accepted": "T",
            "created_at": "2025-01-03T16:34:50.000000Z",
            "updated_at": "2025-01-03T21:57:51.000000Z",
            "deleted_at": null,
            "payment_gateways_id": 5,
            "settings_id": 2,
            "for_customer_use": 0,
            "generate_expense": 0,
            "void_refund": 0,
            "generate_expense_id": null,
            "void_refund_expense_id": null,
            "expense_import": 0,
            "is_multiple": 0,
            "show_notes_table": 0,
            "payment_method_id": 5,
            "pos_money": [],
            "formattedNameLabel": "Terminal Account test iposPay (Terminal)",
            "registrationdatafees": null,
            "IsPaymentFeeActive": "NO"
        }
    ],
    "success": true
}

### 2. Terminal Settings

#### `GET /v2/ipos-pays/setting`

Lists all terminal settings configurations.

#### `GET /v2/ipos-pays/setting/{settingId}/default`

Gets configuration for a specific terminal.

**Response:**
{
    "data": {
        "id": 2,
        "name": "Terminal Real",
        "tpn": "7343202426",
        "auth_key": "NH53bcE5xe",
        "status": 1,
        "status_label": "OFFLINE",
        "environment": 1,
        "environment_label": "PRODUCTION",
        "created_at": "2025-01-03T21:36:34.000000Z",
        "updated_at": "2025-01-03T21:36:34.000000Z",
        "default": 0,
        "print_receipt_sale": 0,
        "print_receipt_void": 0,
        "print_receipt_return": 0,
        "default_payment_type": "Credit",
        "enabled": 1,
        "capture_signature": 0,
        "endpoint": "https://api.spinpos.net/v2/",
        "terminal_status": "Offline",
        "enable_fee_charges": 0
    }
}

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
{
    "success": false,
    "message": " Error on SPIn proxy side",
    "full_message": "Terminal in use, please wait 1 min 30 sec"
}

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